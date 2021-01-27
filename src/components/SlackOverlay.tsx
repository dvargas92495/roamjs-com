import { Button, Icon, Popover, Spinner } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";

type ContentProps = {
  tag: string;
  getUrl: () => string;
};

const SlackContent: React.FunctionComponent<ContentProps> = ({
  tag,
  getUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    axios
      .post(getUrl(), { text: "Hello, World!" })
      .then(() => setLoading(false));
  }, [getUrl, setLoading]);
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send to ${tag}`} onClick={onClick} />
      {loading && <Spinner />}
    </div>
  );
};

const SlackOverlay: React.FunctionComponent<ContentProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(
    (e: React.MouseEvent) => {
      setIsOpen(true);
      e.preventDefault();
      e.stopPropagation();
    },
    [setIsOpen]
  );
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
          onMouseDown={open}
        />
      }
      content={<SlackContent {...props} />}
      isOpen={isOpen}
      onInteraction={setIsOpen}
    />
  );
};

export const render = ({
  parent,
  ...contentProps
}: {
  parent: HTMLSpanElement;
} & ContentProps): void =>
  ReactDOM.render(<SlackOverlay {...contentProps} />, parent);

export default SlackOverlay;
