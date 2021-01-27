import { Icon } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";

const SlackOverlay: React.FunctionComponent = () => {
  return <Icon icon={<Slack />} />;
};

export const render = (parent: HTMLSpanElement): void =>
  ReactDOM.render(<SlackOverlay />, parent);

export default SlackOverlay;
