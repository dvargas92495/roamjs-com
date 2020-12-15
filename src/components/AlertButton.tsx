import {
  Button,
  Checkbox,
  InputGroup,
  Label,
  Popover,
} from "@blueprintjs/core";
import { parseDate } from "chrono-node";
import React, { ChangeEvent, useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { asyncPaste, openBlock } from "roam-client";
import differenceInMillieseconds from "date-fns/differenceInMilliseconds";
import userEvent from "@testing-library/user-event";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

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
  const onButtonClick = useCallback(async () => {
    const whenDate = parseDate(when);
    const timeout = differenceInMillieseconds(whenDate, new Date());
    const textarea = await openBlock(document.getElementById(blockId));
    await userEvent.clear(textarea);
    if (timeout > 0) {
      setTimeout(() => {
        const oldTitle = document.title;
        document.title = `* ${oldTitle}`;
        window.alert(message);
        document.title = oldTitle;
      }, timeout);
      await asyncPaste(
        `Alert scheduled to trigger in ${formatDistanceToNow(whenDate)}`
      );
    } else {
      await asyncPaste(`Alert scheduled to with an invalid date`);
    }
  }, [blockId, when, message]);
  return (
    <div style={{ padding: 8, paddingRight: 24 }}>
      <InputGroup
        value={when}
        onChange={onWhenChange}
        placeholder={"When"}
        style={{ margin: 8 }}
        autoFocus={true}
      />
      <InputGroup
        value={message}
        onChange={onMessageChange}
        placeholder={"Message"}
        style={{ margin: 8 }}
      />
      <Label style={{ margin: 8 }}>
        <Checkbox />
      </Label>
      <Button text="Schedule" onClick={onButtonClick} style={{ margin: 8 }} />
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
