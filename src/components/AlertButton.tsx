import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Icon,
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
import { getRenderRoot, useDocumentKeyDown } from "./hooks";

export const LOCAL_STORAGE_KEY = "roamjsAlerts";

export type AlertContent = {
  when: string;
  message: string;
  id: number;
  allowNotification: boolean;
};

const WindowAlert: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [oldTitle, setOldTitle] = useState("");
  const onClose = useCallback(() => {
    document.title = oldTitle;
    setIsOpen(false);
  }, [oldTitle, setIsOpen]);
  window.roamjs.extension.alert.open = useCallback(
    (input: Omit<AlertContent, "when">) => {
      setOldTitle(document.title);
      document.title = `* ${document.title}`;
      setIsOpen(true);
      setMessage(input.message);
      removeAlertById(input.id);
    },
    [setIsOpen, setMessage, setOldTitle]
  );
  return (
    <Alert isOpen={isOpen} className={"roamjs-window-alert"} onClose={onClose}>
      {message}
    </Alert>
  );
};

const AlertDashboard: React.FunctionComponent = () => {
  const [alerts, setAlerts] = useState<AlertContent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const listener = useCallback(
    (e) => {
      if (e.altKey && e.shiftKey && e.key === "A") {
        setIsOpen(true);
        const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storage) {
          const { alerts: storageAlerts } = JSON.parse(storage);
          setAlerts(storageAlerts);
        } else {
          setAlerts([]);
        }
      }
    },
    [setIsOpen, setAlerts]
  );
  useDocumentKeyDown(listener);
  return (
    <Dialog isOpen={isOpen}>
      <ul>
        {alerts.map((a) => (
          <li key={a.id}>
            {a.when} - {a.message}
            <Button
              onClick={() => {
                window.clearTimeout(a.id);
                removeAlertById(a.id);
              }}
            >
              <Icon icon={"trash"} />
            </Button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
};

export const renderWindowAlert = (): void =>
  ReactDOM.render(
    <>
      <WindowAlert />
      <AlertDashboard />
    </>,
    getRenderRoot()
  );

const removeAlertById = (alertId: number) => {
  const { alerts } = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({
      alerts: alerts.filter((a: AlertContent) => a.id !== alertId),
    })
  );
};

export const schedule = (
  input: Omit<Omit<AlertContent, "when">, "id"> & { timeout: number }
): number => {
  const id = window.setTimeout(() => {
    if (
      input.allowNotification &&
      window.Notification.permission === "granted"
    ) {
      const n = new window.Notification("RoamJS Alert", {
        body: input.message,
      });
      n.addEventListener("show", () => removeAlertById(id));
    } else {
      window.roamjs.extension.alert.open(input);
    }
  }, input.timeout);
  return id;
};

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
  const [allowNotification, setAllowNotification] = useState(false);
  const onCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAllowNotification(e.target.checked);
      if (window.Notification.permission === "default" && e.target.checked) {
        Notification.requestPermission().then((result) => {
          if (result === "denied") {
            setAllowNotification(false);
          }
        });
      }
    },
    [setAllowNotification]
  );
  const onButtonClick = useCallback(async () => {
    const whenDate = parseDate(when);
    const timeout = differenceInMillieseconds(whenDate, new Date());
    const block = document.getElementById(blockId);
    const textarea = await openBlock(block);
    await userEvent.clear(textarea);
    if (timeout > 0) {
      const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
      const { alerts } = storage ? JSON.parse(storage) : { alerts: [] };
      const id = schedule({
        message,
        timeout,
        allowNotification,
      });
      await asyncPaste(
        `Alert scheduled to trigger in ${formatDistanceToNow(whenDate)}`
      );

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          alerts: [
            ...alerts,
            {
              when: whenDate.toJSON(),
              message,
              id,
            },
          ],
        })
      );
    } else {
      await asyncPaste(`Alert scheduled to with an invalid date`);
    }
  }, [blockId, when, message, allowNotification, close]);
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
        Allow Notification?
        <Checkbox
          checked={allowNotification}
          onChange={onCheckboxChange}
          disabled={window.Notification.permission === "denied"}
        />
      </Label>
      <Button text="Schedule" onClick={onButtonClick} style={{ margin: 8 }} />
    </div>
  );
};

const AlertButton = ({ blockId }: { blockId: string }): JSX.Element => (
  <Popover
    content={<AlertButtonContent blockId={blockId} />}
    target={<Button text="ALERT" data-roamjs-alert-button />}
    defaultIsOpen={true}
  />
);

export const render = (b: HTMLButtonElement): void =>
  ReactDOM.render(
    <AlertButton blockId={b.closest(".roam-block").id} />,
    b.parentElement
  );

export default AlertButton;
