import { Button, InputGroup, Popover } from "@blueprintjs/core";
import React, { ChangeEvent, useCallback, useState } from "react";
import ReactDOM from "react-dom";

const AlertButtonContent = ({ blockId }: { blockId: string }) => {
  const [when, setWhen] = useState("");
  const onWhenChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setWhen(e.target.value),
    [setWhen]
  );
  const [message, setMessage] = useState("");
  const onMessageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value),
    [setMessage]
  );
  return (
    <div style={{ padding: 16 }}>
      <InputGroup
        value={when}
        onChange={onWhenChange}
        placeholder={"When"}
      />
      <InputGroup
        value={message}
        onChange={onMessageChange}
        placeholder={"Message"}
      />
      <Button text="Schedule" />
    </div>
  );
};

const AlertButton = ({ blockId }: { blockId: string }) => {
  return (
    <Popover
      content={<AlertButtonContent blockId={blockId} />}
      target={<Button text="ALERT" data-roamjs-alert-button />}
      defaultIsOpen={true}
    />
  );
};

export const render = (b: HTMLButtonElement) =>
  ReactDOM.render(
    <AlertButton blockId={b.closest(".roam-block").id} />,
    b.parentElement
  );

export default AlertButton;
