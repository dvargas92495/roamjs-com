import ReactDOM from "react-dom";
import React from "react";
import { getRenderRoot } from "./hooks";
import { Intent, Position, Toast as BPToast, Toaster } from "@blueprintjs/core";

const Toast: React.FunctionComponent<{ onDismiss: () => void }> = ({
  children,
  onDismiss,
}) => {
  return (
    <Toaster position={Position.TOP} canEscapeKeyClear>
      <BPToast
        intent={Intent.WARNING}
        onDismiss={onDismiss}
        message={children}
      />
    </Toaster>
  );
};

export const render = ({
  id,
  content,
}: {
  id: string;
  content: string;
}): void => {
  const parent = getRenderRoot(id);
  ReactDOM.render(
    <Toast
      onDismiss={() => {
          ReactDOM.unmountComponentAtNode(parent);
          parent.remove();
      }}
    >
      {content}
    </Toast>,
    parent
  );
};

export default Toast;
