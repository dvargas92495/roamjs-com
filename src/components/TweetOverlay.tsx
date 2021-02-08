import { Button, Icon, Popover, Spinner, Text } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import { getTreeByBlockUid } from "roam-client";

type ContentProps = {
  blockUid: string;
};

const TwitterContent: React.FunctionComponent<
  ContentProps & { close: () => void }
> = ({ close, blockUid }) => {
  const message = getTreeByBlockUid(blockUid).children.map((t) => t.text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onClick = useCallback(() => {
    setLoading(true);
    setError("");
    // const tree = getTreeByPageName("roam/js/slack");
    Promise.resolve(console.log(message))
      .then(close)
      .catch(({ error, message }) => {
        setError(error || message);
        setLoading(false);
      });
  }, [setLoading, close, setError]);
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send Tweet`} onClick={onClick} />
      {loading && <Spinner />}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          <Text>{error}</Text>
        </div>
      )}
    </div>
  );
};

const TweetOverlay: React.FunctionComponent<ContentProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      target={
        <Icon
          icon={<Twitter style={{ width: 15, marginLeft: 4, cursor: 'pointer' }} />}
          onClick={open}
        />
      }
      content={<TwitterContent {...props} close={close} />}
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
  ReactDOM.render(<TweetOverlay {...contentProps} />, parent);

export default TweetOverlay;
