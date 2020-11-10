import React, { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@dvargas92495/react-draft-wysiwyg";
import {
  EditorState,
  ContentState,
  ContentBlock,
  CharacterMetadata,
} from "draft-js";
import { List } from "immutable";
import "@dvargas92495/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import ReactDOM from "react-dom";
import { TextArea } from "@blueprintjs/core";
import { useDocumentKeyDown } from "./hooks";
import userEvent from "@testing-library/user-event";
import { asyncType } from "roam-client";

type EditorType = {
  getEditorState: () => EditorState;
} & Editor;

const indicesOf = (matcher: string, test: string) => {
  const regex = new RegExp(matcher, "g");
  let match;
  let indices = [];
  while ((match = regex.exec(test))) {
    indices.push(match.index);
  }
  return indices;
};

const groupSlice = (arr: any[]) => arr.slice(0, Math.floor(arr.length / 2) * 2);

const parseValue = (s: string) => {
  const textData = Array.from(s).map((c) => ({
    c,
    styles: [] as string[],
    keep: true,
  }));

  const boldIndices = indicesOf("\\*\\*", s);
  const groupedBoldIndices = groupSlice(boldIndices);
  for (let pointer = 0; pointer < groupedBoldIndices.length; pointer += 2) {
    const start = groupedBoldIndices[pointer];
    const end = groupedBoldIndices[pointer + 1];
    for (let td = start + 2; td < end; td++) {
      textData[td].styles.push("BOLD");
    }
    textData[start].keep = false;
    textData[start + 1].keep = false;
    textData[end].keep = false;
    textData[end + 1].keep = false;
  }
  const filteredTextData = textData.filter((td) => td.keep);
  const text = filteredTextData.map((t) => t.c).join("");
  const characterList = List(
    filteredTextData.map((t) =>
      t.styles.reduce(
        (c, s) => CharacterMetadata.applyStyle(c, s),
        CharacterMetadata.create()
      )
    )
  );
  return [
    new ContentBlock({
      characterList,
      type: "paragraph",
      text,
    }),
  ];
};

const blockToString = (contentBlock: ContentBlock) => {
  const text = contentBlock.getText();
  const characterList = contentBlock.getCharacterList();
  const length = contentBlock.getLength();
  let markdown = "";
  let bolded = false;
  for (let index = 0; index < length; index++) {
    const isBold = characterList.get(index).hasStyle("BOLD");
    if (!bolded && isBold) {
      markdown = `${markdown}**`;
      bolded = true;
    } else if (bolded && !isBold) {
      markdown = `${markdown}**`;
      bolded = false;
    }
    markdown = `${markdown}${text.charAt(index)}`;
  }
  if (bolded) {
    markdown = `${markdown}**`;
  }
  return markdown;
};

const WYSIWYGMode = ({
  initialValue,
  initialStart,
  initialEnd,
  onUnmount,
}: {
  initialValue: string;
  initialStart: number;
  initialEnd: number;
  onUnmount: ({
    output,
    start,
    end,
  }: {
    output: string;
    start: number;
    end: number;
  }) => void;
}) => {
  const editorRef = useRef<EditorType>(null);
  const outputOnUnmount = useCallback(() => {
    const editorState = editorRef.current.getEditorState();
    console.log(editorState.getCurrentContent().getBlocksAsArray());
    const output = editorState
      .getCurrentContent()
      .getBlocksAsArray()
      .map(blockToString)
      .join("\n");
    const selection = editorState.getSelection();
    onUnmount({
      output,
      start: selection.getStartOffset(),
      end: selection.getEndOffset(),
    });
  }, [onUnmount, editorRef]);

  const eventListener = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "w" && e.altKey) {
        outputOnUnmount();
        e.stopImmediatePropagation();
      }
    },
    [outputOnUnmount]
  );

  useDocumentKeyDown(eventListener);

  useEffect(() => () => outputOnUnmount, [outputOnUnmount]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focusEditor();
    }
  }, [editorRef]);
  return (
    <>
      <style>
        {`.public-DraftStyleDefault-block {
        margin: 0;
      }`}
      </style>
      <Editor
        toolbar={{
          options: ["inline", "blockType", "textAlign", "link", "image"],
          inline: {
            options: ["bold", "italic", "strikethrough", "monospace"],
          },
          blockType: {
            inDropdown: false,
            options: ["Normal", "H1", "H2", "H3", "Code"],
          },
          textAlign: {
            options: ["left", "center", "right"],
          },
        }}
        editorClassName={
          "roam-block dont-unfocus-block hoverparent rm-block-text"
        }
        wrapperStyle={{
          display: "flex",
          flexDirection: "column-reverse",
        }}
        ref={(ref) => (editorRef.current = ref as EditorType)}
        defaultEditorState={EditorState.createWithContent(
          ContentState.createFromBlockArray(parseValue(initialValue))
        )}
        defaultSelectionStart={initialStart}
        defaultSelectionEnd={initialEnd}
        onBlur={outputOnUnmount}
      />
    </>
  );
};

export const renderWYSIWYGMode = (
  b: HTMLElement,
  textarea: HTMLTextAreaElement,
  onUnmount: () => void
) =>
  ReactDOM.render(
    <WYSIWYGMode
      initialValue={textarea.value}
      initialStart={textarea.selectionStart}
      initialEnd={textarea.selectionEnd}
      onUnmount={async ({ output, start, end }) => {
        ReactDOM.unmountComponentAtNode(b);
        b.parentElement.removeChild(b);
        onUnmount();
        textarea.focus();
        await userEvent.clear(textarea);
        await asyncType(output);
        textarea.setSelectionRange(start, end);
      }}
    />,
    b
  );

const DemoTextArea = React.forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    setValue: (v: string) => void;
    wysiwyg: () => void;
  }
>(({ wysiwyg, value, setValue }, ref) => {
  const eventListener = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "w" && e.altKey) {
        wysiwyg();
        e.stopImmediatePropagation();
      }
    },
    [wysiwyg]
  );
  useDocumentKeyDown(eventListener);
  return (
    <TextArea
      growVertically={true}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      id={"blockId"}
      style={{ width: "100%", resize: "none" }}
      inputRef={ref}
    />
  );
});

export const DemoWYSIWYGMode = () => {
  const [isBlock, setIsBlock] = useState(true);
  const [isOutputting, setIsOutputting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [value, setValue] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const wysiwyg = useCallback(() => {
    setInitialValue(value);
    setIsBlock(false);
  }, [setIsBlock, setInitialValue, value]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (isOutputting) {
      textareaRef.current.focus();
      setIsOutputting(false);
      setIsSelecting(true);
      textareaRef.current.setSelectionRange(selection.start, selection.end);
    }
  }, [setIsOutputting, textareaRef, isOutputting, setIsSelecting]);
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      textareaRef.current.setSelectionRange(selection.start, selection.end);
    }
  }, [isSelecting, textareaRef, selection, setIsSelecting]);

  const onUnmount = useCallback(
    ({ output, start, end }) => {
      setIsBlock(true);
      setValue(output);
      setIsOutputting(true);
      setSelection({ start, end });
    },
    [setIsOutputting, setValue, setIsBlock]
  );
  return (
    <div style={{ border: "1px solid black" }}>
      {isBlock ? (
        <DemoTextArea
          wysiwyg={wysiwyg}
          ref={textareaRef}
          value={value}
          setValue={setValue}
        />
      ) : (
        <WYSIWYGMode
          initialValue={initialValue}
          initialStart={textareaRef.current.selectionStart}
          initialEnd={textareaRef.current.selectionEnd}
          onUnmount={onUnmount}
        />
      )}
    </div>
  );
};

export default WYSIWYGMode;
