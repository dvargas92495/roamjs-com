import { Dialog, InputGroup, Menu, MenuItem } from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { isApple } from "../entry-helpers";
import { useArrowKeyDown } from "./hooks";

const os = (apple: string, windows: string) => (isApple ? apple : windows);
const control = (key: string) => os(`Cmd-${key}`, `Ctrl-${key}`);

const COMMANDS = [
  { command: "Search Page", shortcut: control("f"), disabled: true },
  { command: "Indent Block", shortcut: "Tab" },
  { command: "Unindent Block", shortcut: "Shift-Tab" },
  { command: "Move Block Up", shortcut: os("Ctrl-Shift-Up", "Alt-Shift-Up") },
  {
    command: "Move Block Down",
    shortcut: os("Ctrl-Shift-Down", "Alt-Shift-Down"),
  },
  { command: "Create a New Line", shortcut: "Shift-Enter", disabled: true },
  { command: "Redo", shortcut: control("y") },
  { command: "Add Version", shortcut: "Ctrl-Comma" },
  { command: "Expand all Versions", shortcut: "Ctrl-Period" },
  { command: "Cycle Version Right", shortcut: "Ctrl-Shift->" },
  { command: "Cycle Version Left", shortcut: "Ctrl-Shift-<" },
  { command: "Toggle Right Sidebar", shortcut: control("Shift-\\") },
  { command: "Toggle Left Sidebar", shortcut: control("\\") },
  { command: "Select Block Above", shortcut: "Shift-Up", disabled: true },
  { command: "Select Block Below", shortcut: "Shift-Down", disabled: true },
  { command: "Close This Dialog", shortcut: "Esc" },
  { command: "Search Database", shortcut: control("u") },
  {
    command: "Open Page In Sidebar From Search Results",
    shortcut: "Shift-Enter",
    disabled: true,
  },
  {
    command: "Jump to Daily Notes Page",
    shortcut: os("Ctrl-Shift-D", "Alt-d"),
  },
  { command: "Open Page From Block", shortcut: control("o") },
  { command: "Open Page In Sidebar From Block", shortcut: control("Shift-O") },
  { command: "Toggle Brackets", shortcut: control("c-b"), disabled: true },
  { command: "Toggle Namespace", shortcut: control("c-l"), disabled: true },
  { command: "Create a Block", shortcut: "Enter" },
  { command: "Undo", shortcut: control("z") },
  { command: "Zoom Into Block", shortcut: os("Cmd-Period", "Alt-Right") },
  { command: "Zoom Out to Parent", shortcut: os("Cmd-Comma", "Alt-Left") },
  { command: "Open This Dialog", shortcut: "Ctrl-Shift-?", disabled: true },
  { command: "Collapse All Child Blocks", shortcut: control("Up") },
  { command: "Expand All Child Blocks", shortcut: control("Down") },
  { command: "Select All Blocks", shortcut: control("Shift-A") },
  { command: "Make Block H1", shortcut: control("Alt-1") },
  { command: "Make Block H2", shortcut: control("Alt-2") },
  { command: "Make Block H3", shortcut: control("Alt-3") },
  { command: "Make Block Paragraph", shortcut: control("Alt-0") },
  { command: "Toggle TODO/DONE", shortcut: control("Enter") },
  { command: "Bold Text", shortcut: control("b") },
  { command: "Italicize", shortcut: control("i") },
  { command: "Create External Link", shortcut: control("k") },
  { command: "Highlight Text", shortcut: control("h") },
  { command: "Open Search Dialog", shortcut: control("Shift-9") },
  { command: "Jump to First Block", shortcut: control("Enter") },
  { command: "Jump to Last Block", shortcut: control("Shift-Enter") },
  { command: "Add Shortcut To Page", shortcut: control("Shift-S") },
];

const convertKey = (k: string) => {
  switch (k) {
    case "Esc":
      return "Escape";
    case "Space":
      return " ";
    case "Up":
      return "ArrowUp";
    case "Down":
      return "ArrowDown";
    case "Left":
      return "ArrowLeft";
    case "Right":
      return "ArrowRight";
    case "Comma":
      return ",";
    case "Period":
      return ".";
    default:
      return k;
  }
};

const convertCode = (k: string) => {
  switch (k) {
    case "Esc":
      return "Escape";
    case "Up":
      return "ArrowUp";
    case "Down":
      return "ArrowDown";
    case "Left":
      return "ArrowLeft";
    case "Right":
      return "ArrowRight";
    case "Enter":
    case "Tab":
    case "Space":
    case "Comma":
    case "Period":
      return k;
    case ">":
      return "Period";
    case "<":
      return "Comma";
    case "\\":
      return "Backslash";
    default:
      return `Key${k.toUpperCase()}`;
  }
};

const convertKeyCode = (k: string) => {
  switch (k) {
    case "Esc":
      return 27;
    case "Space":
      return 32;
    case "Up":
      return 38;
    case "Down":
      return 40;
    case "Left":
      return 37;
    case "Right":
      return 39;
    case "Enter":
      return 13;
    case "Tab":
      return 9;
    case "<":
    case "Comma":
      return 188;
    case ">":
    case "Period":
      return 190;
    case "\\":
      return 220;
    default:
      return k.toUpperCase().charCodeAt(0);
  }
};

const convertShortcut = (shortcut: string): KeyboardEvent => {
  const parts = shortcut.split("-");
  return new KeyboardEvent("keydown", {
    ctrlKey: parts.indexOf("Ctrl") > -1,
    shiftKey: parts.indexOf("Shift") > -1,
    altKey: parts.indexOf("Alt") > -1,
    metaKey: parts.indexOf("Cmd") > -1,
    key: convertKey(parts[parts.length - 1]),
    code: convertCode(parts[parts.length - 1]),
    bubbles: true,
    cancelable: true,
    composed: true,
    // @ts-ignore
    keyCode: convertKeyCode(parts[parts.length - 1]),
    returnValue:
      parts.length == 2 &&
      parts[0] === "Shift" &&
      ["Up", "Down", "Enter"].indexOf(parts[1]) > -1,
  });
};

const ROAMJS_MOUSELESS_SEARCH_INPUT = "roamjs-mouseless-search-input";

const MouselessDialog = () => {
  const previousFocus = useRef(null);
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
      if ((e.key === "?" || e.key === "/") && e.shiftKey && e.ctrlKey) {
        previousFocus.current = document.activeElement;
        setIsOpen(true);
      }
    },
    [setIsOpen, previousFocus]
  );
  const onClose = useCallback(() => {
    if ((previousFocus.current as HTMLElement).tabIndex >= 0) {
      previousFocus.current.focus();
    } else {
      (document.activeElement as HTMLInputElement).blur();
    }
    setIsOpen(false);
  }, [setIsOpen, previousFocus]);
  const onEnter = useCallback(
    ({ shortcut, disabled }: { shortcut: string; disabled?: boolean }) => {
      if (disabled) {
        return;
      }
      onClose();
      if (shortcut === "Esc") {
        return;
      }
      const evt = convertShortcut(shortcut);
      document.activeElement.dispatchEvent(evt);
    },
    [onClose]
  );
  const { activeIndex, onKeyDown } = useArrowKeyDown({
    onEnter,
    results,
  });

  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  }, [eventListener]);
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      style={{ padding: 16, position: "absolute", top: 64 }}
    >
      <InputGroup
        placeholder={"Search Command..."}
        autoFocus={true}
        onChange={onInputChange}
        value={value}
        onKeyDown={onKeyDown}
        id={ROAMJS_MOUSELESS_SEARCH_INPUT}
      />
      {value && (
        <Menu>
          {results.length
            ? results.slice(0, 10).map((k, i) => (
                <MenuItem
                  text={k.command}
                  label={k.shortcut}
                  key={k.command}
                  active={i === activeIndex}
                  disabled={k.disabled}
                  style={{
                    border:
                      k.disabled && i === activeIndex && "1px solid #137cbd",
                    boxSizing: "border-box",
                  }}
                  onClick={() => onEnter(k)}
                />
              ))
            : "No command..."}
        </Menu>
      )}
    </Dialog>
  );
};

export const renderMouselessDialog = (c: HTMLDivElement) =>
  ReactDOM.render(<MouselessDialog />, c);

export default MouselessDialog;
