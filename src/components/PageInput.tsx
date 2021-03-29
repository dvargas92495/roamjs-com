import {
  Popover,
  PopoverPosition,
  Menu,
  MenuItem,
  InputGroup,
} from "@blueprintjs/core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { getAllPageNames } from "roam-client";
import { useArrowKeyDown } from "./hooks";

const searchPagesByString = (q: string, extra: string[]) =>
  [...getAllPageNames(), ...extra]
    .filter((a) => a.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 9);

const PageInput = ({
  value,
  setValue,
  onBlur,
  extra = [],
}: {
  value: string;
  setValue: (q: string) => void;
  onBlur?: (v: string) => void;
  extra?: string[];
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const items = useMemo(
    () => (value && isOpen ? searchPagesByString(value, extra) : []),
    [value]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeIndex, onKeyDown } = useArrowKeyDown({
    onEnter: (value) => {
      setValue(value);
      close();
    },
    results: items,
  });
  return (
    <Popover
      captureDismiss={true}
      isOpen={isOpen}
      onOpened={open}
      minimal={true}
      position={PopoverPosition.BOTTOM_LEFT}
      content={
        <Menu style={{ maxWidth: 400 }}>
          {items.map((t, i) => (
            <MenuItem
              text={t}
              active={activeIndex === i}
              key={i}
              multiline
              onClick={() => {
                setValue(items[i]);
                close();
                inputRef.current.focus();
              }}
            />
          ))}
        </Menu>
      }
      target={
        <InputGroup
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
            setIsOpen(!!e.target.value);
          }}
          placeholder={"Search for a page"}
          autoFocus={true}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (e.relatedTarget) {
              close();
            }
            if (onBlur) {
              onBlur(e.target.value);
            }
          }}
          inputRef={inputRef}
        />
      }
    />
  );
};

export default PageInput;
