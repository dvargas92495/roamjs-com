import { Alert } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import { track } from "../entry-helpers";

const DeprecationWarning = ({
  message,
  onConfirm,
  onClose,
}: {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}): React.ReactElement => {
  return (
    <>
      <style>{`.roamjs-deprecation-warning button.bp3-button {
  display: flex !important;
}`}</style>
      <Alert
        isOpen={true}
        onConfirm={onConfirm}
        onClose={onClose}
        canEscapeKeyCancel
        canOutsideClickCancel
        cancelButtonText={"cancel"}
        className={"roamjs-deprecation-warning"}
      >
        {message}
        <br />
        <br />
        <span>
          If removing this functionality would be an issue, please reach out to
          support@roamjs.com.
        </span>
      </Alert>
    </>
  );
};

export const render = ({
  parent,
  message,
  callback,
  type,
}: {
  parent: HTMLDivElement;
  message: string;
  callback: () => void;
  type: string;
}): void => {
  track("Legacy Feature", { type });
  ReactDOM.render(
    <DeprecationWarning
      message={message}
      onConfirm={callback}
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default DeprecationWarning;
