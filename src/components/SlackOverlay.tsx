import { Button, Icon, Popover, Spinner } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";
import { WebClient } from "@slack/web-api";

type ContentProps = {
  tag: string;
  getToken: () => string;
  message: string;
};

const web = new WebClient();
delete web["axios"].defaults.headers["User-Agent"];

const SlackContent: React.FunctionComponent<
  ContentProps & { close: () => void }
> = ({ tag, getToken, close, message }) => {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    const token = getToken();
    web.users
      .list({ token })
      .then((r) => {
        const members = r.members as { real_name: string; id: string }[];
        const memberId = members.find((m) => m.real_name === tag)?.id;
        return web.chat.postMessage({
          channel: memberId,
          text: message,
          token,
        });
      })
      .then(close)
      .catch(() => setLoading(false));
  }, [getToken, setLoading, close, tag]);
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
