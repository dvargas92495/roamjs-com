import { Dialog, InputGroup, Menu, MenuItem } from "@blueprintjs/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { isApple, isControl } from "../entry-helpers";

const os = (apple: string, windows: string) => isApple ? apple : windows;
const control = (key: string) => os(`Cmd-${key}`, `Ctrl-${key}`);

const COMMANDS = [
  { command: "Close This Modal", shortcut: "Esc" },
  { command: "Search Database", shortcut: control("u") },
  { command: "Search Page", shortcut: control("f") },
  {
    command: "Open Page In Sidebar From Search Results",
    shortcut: "Shift-Enter",
  },
  { command: "Jump to Daily Notes Page", shortcut: control("Shift-D") },
  { command: "Open Page From Block", shortcut: control("o") },
  { command: "Open Page In Sidebar From Block", shortcut: control("Shift-O") },
  { command: "Toggle Brackets", shortcut: control('c-b')},
  {command: "Toggle Namespace", shortcut: control('c-l')},
  {command: "Indent Block", shortcut: 'Tab'},
  {command: 'Unindent Block', shortcut: 'Shift-Tab'},
  {command: 'Move Block Up', shortcut: control('Shift-Up')},
  {command: 'Move Block Down', shortcut: control('Shift-Down')},
  {command: 'Create a Block', shortcut: 'Enter'},
  {command: 'Create a New Line', shortcut: 'Shift-Enter'},
  {command: 'Undo', shortcut: control('z')},
  {command: 'Redo', shortcut: control('Shift-Z')},
  {command: 'Zoom Into Block', shortcut: os('Cmd-.',"Alt-Right")},
  {command: 'Zoom Out to Parent', shortcut: os('Cmd-,','Alt-Left')},
  {command: 'Open This Modal', shortcut: control('Shift-?')},
  {command: 'Collapse All Child Blocks', shortcut: control('Up')},
  {command: 'Expand All Child Blocks', shortcut: control('Down')},
  {command: "Select All Blocks", shortcut: control('Shift-A')}
];

const MouselessModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const onInputChange = useCallback((e) => setValue(e.target.value), [
    setValue,
  ]);
  const results = useMemo(
    () =>
      value
        ? COMMANDS.filter(
            (c) => c.command.toUpperCase().indexOf(value.toUpperCase()) > -1
          )
        : [],
    [value]
  );
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
    <Dialog isOpen={isOpen} onClose={onClose} style={{ padding: 16 }}>
      <InputGroup
        placeholder={"Search Command..."}
        autoFocus={true}
        onChange={onInputChange}
        value={value}
      />
      <Menu>
        {results.slice(0, 10).map((k) => (
          <MenuItem text={k.command} label={k.shortcut} key={k.command} />
        ))}
      </Menu>
    </Dialog>
  );
};

export const renderMouselessModal = (c: HTMLDivElement) =>
  ReactDOM.render(<MouselessModal />, c);

export default MouselessModal;
