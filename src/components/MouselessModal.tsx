import { Dialog, InputGroup } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { isControl } from "../entry-helpers";

const MouselessModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const eventListener = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey && isControl(e)) {
        setIsOpen(true);
      }
    },
    [setIsOpen]
  );
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  }, [eventListener]);
  return (
    <Dialog isOpen={isOpen} onClose={onClose} style={{padding: 16}}>
      <InputGroup placeholder={"Search Command..."} autoFocus={true} />
    </Dialog>
  );
};

export const renderMouselessModal = (c: HTMLDivElement) =>
  ReactDOM.render(<MouselessModal />, c);

export default MouselessModal;
