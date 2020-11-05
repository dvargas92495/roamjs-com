import React, { useCallback, useEffect, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, ContentState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import ReactDOM from "react-dom";

const WYSIWYGMode = ({
  initialValue = "",
  onUnmount = () => {},
}: {
  initialValue?: string;
  onUnmount?: () => void;
}) => {
  const [editorState, setEditorState] = useState<EditorState>(
    EditorState.createWithContent(ContentState.createFromText(initialValue))
  );

  const eventListener = useCallback(
    (e) => {
      if (e.key === "w" && e.altKey && onUnmount) {
        onUnmount();
      }
    },
    [onUnmount]
  );

  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  });
  return (
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
      editorState={editorState}
      onEditorStateChange={setEditorState}
      editorClassName={
        "roam-block dont-unfocus-block hoverparent rm-block-text"
      }
    />
  );
};

export const renderWYSIWYGMode = (
  b: HTMLElement,
  v: string,
  onUnmount: () => void
) =>
  ReactDOM.render(
    <WYSIWYGMode
      initialValue={v}
      onUnmount={() => {
        ReactDOM.unmountComponentAtNode(b);
        b.parentElement.removeChild(b);
        onUnmount();
      }}
    />,
    b
  );

export const DemoWYSIWYGMode = () => (
  <div style={{ border: "1px solid black" }}>
    <WYSIWYGMode />
  </div>
);

export default WYSIWYGMode;
