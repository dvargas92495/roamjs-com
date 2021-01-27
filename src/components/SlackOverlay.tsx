import { Button, Icon, Popover, Spinner } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";

type ContentProps = {
  tag: string;
  getUrl: () => string;
};

const SlackContent: React.FunctionComponent<
  ContentProps & { close: () => void }
> = ({ tag, getUrl, close }) => {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    axios
      .post(
        getUrl(),
        JSON.stringify({ text: "Hello, World!" }),
        {
          withCredentials: false,
          transformRequest: [
            (data, headers) => {
              delete headers.post["Content-Type"];
              return data;
            },
          ],
        }
      )
      .then(close)
      .catch(() => setLoading(false));
  }, [getUrl, setLoading, close]);
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send to ${tag}`} onClick={onClick} />
      {loading && <Spinner />}
    </div>
  );
};

const SlackOverlay: React.FunctionComponent<ContentProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
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
          onClick={open}
        />
      }
      content={<SlackContent {...props} close={close} />}
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
