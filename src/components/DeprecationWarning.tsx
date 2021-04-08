import { Alert } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import { track } from "../entry-helpers";

const DeprecationWarning = ({
  message,
  onConfirm,
}: {
  message: string;
  onConfirm: () => void;
}): React.ReactElement => {
  return (
    <Alert isOpen={true} onConfirm={onConfirm}>
      {message}
      <br />
      <br />
      <span>
        If removing this functionality would be an issue, please reach out to
        support@roamjs.com.
      </span>
    </Alert>
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
      onConfirm={() => {
        callback();
        ReactDOM.unmountComponentAtNode(parent);
      }}
    />,
    parent
  );
};

export default DeprecationWarning;
