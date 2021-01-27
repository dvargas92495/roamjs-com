import { Button, Icon, Popover } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";

const SlackContent: React.FunctionComponent<{ tag: string }> = ({ tag }) => {
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send to ${tag}`} />
    </div>
  );
};

const SlackOverlay: React.FunctionComponent<{ tag: string }> = ({ tag }) => {
  return (
    <Popover
      target={
        <Icon
          icon={
            <Slack
              viewBox="70 70 130 130"
              style={{ width: 15, marginLeft: 4 }}
            />
          }
        />
      }
      content={<SlackContent tag={tag} />}
    />
  );
};

export const render = ({
  parent,
  tag,
}: {
  parent: HTMLSpanElement;
  tag: string;
}): void => ReactDOM.render(<SlackOverlay tag={tag} />, parent);

export default SlackOverlay;
