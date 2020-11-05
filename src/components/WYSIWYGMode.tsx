import React, { useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import ReactDOM from "react-dom";

const WYSIWYGMode = () => {
  const [editorState, setEditorState] = useState<EditorState>(
    EditorState.createEmpty()
  );
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

export const renderWYSIWYGMode = (b: HTMLElement) =>
  ReactDOM.render(<WYSIWYGMode />, b);

export default WYSIWYGMode;
