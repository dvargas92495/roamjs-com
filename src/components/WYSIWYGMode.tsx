import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Editor } from "@dvargas92495/react-draft-wysiwyg";
import {
  EditorState,
  ContentState,
  ContentBlock,
  CharacterMetadata,
  genKey,
} from "draft-js";
import { List } from "immutable";
import "@dvargas92495/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import ReactDOM from "react-dom";
import { TextArea } from "@blueprintjs/core";
import { useDocumentKeyDown } from "./hooks";
import userEvent from "@testing-library/user-event";
import { asyncType } from "roam-client";

const ToolbarWarning = () => (
  <span style={{ margin: "0 8px" }}>
    Warning: Clicking Buttons will close WYSIWIG. Use Hot Keys Instead
  </span>
);

type EditorType = {
  getEditorState: () => EditorState;
} & Editor;

const parseValue = ({
  initialValue,
  initialStart,
  initialEnd,
}: {
  initialValue: string;
  initialStart: number;
  initialEnd: number;
}) => {
  const textData = Array.from(initialValue).map((c) => ({
    c,
    styles: [] as string[],
    keep: true,
  }));
  const selection = {
    defaultSelectionStart: initialStart,
    defaultSelectionEnd: initialEnd,
  };
  const deleteIndex = (n: number) => {
    textData[n].keep = false;
    if (initialStart > n) {
      selection.defaultSelectionStart--;
    }
    if (initialEnd > n) {
      selection.defaultSelectionEnd--;
    }
  };

  const applyStyle = (matcher: string, style: string) => {
    const regex = new RegExp(matcher, "g");
    let match;
    let indices = [];
    while ((match = regex.exec(initialValue))) {
      indices.push(match.index);
    }

    const groupedIndices = indices.slice(0, Math.floor(indices.length / 2) * 2);
    for (let pointer = 0; pointer < groupedIndices.length; pointer += 2) {
      const start = groupedIndices[pointer];
      const end = groupedIndices[pointer + 1];
      for (let td = start + 2; td < end; td++) {
        textData[td].styles.push(style);
      }
      [start, start + 1, end, end + 1].forEach(deleteIndex);
    }
  };
  applyStyle("\\*\\*", "BOLD");
  applyStyle("__", "ITALIC");

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
  return {
    ...selection,
    defaultEditorState: EditorState.createWithContent(
      ContentState.createFromBlockArray([
        new ContentBlock({
          characterList,
          type: "paragraph",
          text,
          key: genKey(),
        }),
      ])
    ),
  };
};

const blockToString = (
  contentBlock: ContentBlock,
  selection: {
    start: number;
    end: number;
    initialStart: number;
    initialEnd: number;
    pointer: number;
  }
) => {
  const text = contentBlock.getText();
  const characterList = contentBlock.getCharacterList();
  const length = contentBlock.getLength();
  let markdown = "";
  const addMarkdown = (text: string, i: number) => {
    if (selection.initialStart > i + selection.pointer) {
      selection.start += text.length;
    }
    if (selection.initialEnd > i + selection.pointer) {
      selection.end += text.length;
    }
    return text;
  };

  let bolded = false;
  let italicized = false;
  for (let index = 0; index < length; index++) {
    // unfortunately order matters. __**okay**__ does not apply both styles
    const isBold = characterList.get(index).hasStyle("BOLD");
    const isItalic = characterList.get(index).hasStyle("ITALIC");
    if (!bolded && isBold) {
      markdown = `${markdown}${addMarkdown("**", index)}`;
      bolded = true;
    }
    if (!italicized && isItalic) {
      markdown = `${markdown}${addMarkdown("__", index)}`;
      italicized = true;
    }
    if (italicized && !isItalic) {
      markdown = `${markdown}${addMarkdown("__", index)}`;
      italicized = false;
    }
    if (bolded && !isBold) {
      markdown = `${markdown}${addMarkdown("**", index)}`;
      bolded = false;
    }
    markdown = `${markdown}${text.charAt(index)}`;
  }
  if (italicized) {
    markdown = `${markdown}${addMarkdown("__", length)}`;
  }
  if (bolded) {
    markdown = `${markdown}${addMarkdown("**", length)}`;
  }

  selection.pointer += length;
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
    const editorSelection = editorState.getSelection();
    const editorBlocks = editorState.getCurrentContent().getBlocksAsArray();

    const getOffset = (offset: number, key: string) => {
      let total = offset;
      for (let b = 0; b < editorBlocks.length; b++) {
        const thisBlock = editorBlocks[b];
        if (thisBlock.getKey() !== key) {
          total += thisBlock.getLength();
        } else {
          return total;
        }
      }
      return total;
    };
    const initialStart = getOffset(
      editorSelection.getStartOffset(),
      editorSelection.getStartKey()
    );
    const initialEnd = getOffset(
      editorSelection.getEndOffset(),
      editorSelection.getEndKey()
    );
    const selection = {
      start: initialStart,
      end: initialEnd,
      pointer: 0,
      initialStart,
      initialEnd,
    };
    const output = editorBlocks
      .map((b) => blockToString(b, selection))
      .join("\n");
    onUnmount({
      output,
      start: selection.start,
      end: selection.end,
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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focusEditor();
    }
  }, [editorRef]);
  const {
    defaultEditorState,
    defaultSelectionStart,
    defaultSelectionEnd,
  } = useMemo(() => parseValue({ initialValue, initialStart, initialEnd }), [
    initialValue,
    initialStart,
    initialEnd,
  ]);

  return (
    <>
      <style>
        {`.public-DraftStyleDefault-block {
  margin: 0;
}

.rdw-option-wrapper {
  cursor: not-allowed;
}

.rdw-option-wrapper.rdw-option-active:hover {
  box-shadow: 1px 1px 0px #BFBDBD inset;
}

.rdw-option-wrapper:hover {
  box-shadow: none;
}
`}
      </style>
      <Editor
        toolbar={{
          options: [
            "inline",
            /* "blockType", 
            "textAlign", 
            "link", 
            "image"*/
          ],
          inline: {
            options: [
              "bold",
              "italic",
              // "monospace"
            ],
          },
          blockType: {
            inDropdown: false,
            options: ["Normal", "H1", "H2", "H3", "Code"],
          },
          textAlign: {
            options: ["left", "center", "right"],
          },
        }}
        toolbarCustomButtons={[<ToolbarWarning />]}
        editorClassName={
          "roam-block dont-unfocus-block hoverparent rm-block-text"
        }
        wrapperStyle={{
          display: "flex",
          flexDirection: "column-reverse",
        }}
        ref={(ref) => (editorRef.current = ref as EditorType)}
        defaultEditorState={defaultEditorState}
        defaultSelectionStart={defaultSelectionStart}
        defaultSelectionEnd={defaultSelectionEnd}
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
