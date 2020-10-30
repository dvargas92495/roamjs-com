import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  MenuItem,
  Popover,
  InputGroup,
  Menu,
  PopoverPosition,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { asyncType, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";
import { Icon } from "@blueprintjs/core";
import { isControl } from "../entry-helpers";

enum NODES {
  OR = "OR",
  AND = "AND",
  NOT = "NOT",
  BETWEEN = "BETWEEN",
  TAG = "TAG",
}

const NodeSelect = Select.ofType<NODES>();

type QueryState = {
  type: NODES;
  key: number;
  value?: string;
  children?: QueryState[];
};

const toQueryString = (queryState: QueryState): string => {
  if (queryState.type === NODES.TAG) {
    return `[[${queryState.value}]]`;
  } else {
    const operator = queryState.type.toLocaleString().toLowerCase();
    const children = queryState.children.map((q) => toQueryString(q)).join(" ");
    return `{${operator}:${children}}`;
  }
};

const areEqual = (a: QueryState, b: QueryState): boolean => {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === NODES.TAG) {
    return a.value === b.value;
  }
  const aChildren = a.children;
  const bChildren = b.children;
  return (
    aChildren.length === bChildren.length &&
    aChildren.every((aa, i) => areEqual(aa, bChildren[i]))
  );
};

const colors = ["red", "green", "blue"];

const searchPagesByString = (q: string) =>
  window.roamAlphaAPI
    .q("[:find (pull ?e [:node/title]) :in $ :where [?e :node/title]]")
    .map((a) => a[0]["title"])
    .filter((a) => a.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 9);

const PageInput = ({
  queryState,
  setQueryState,
}: {
  queryState: QueryState;
  setQueryState: (q: QueryState) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const items = useMemo(
    () => (queryState.value ? searchPagesByString(queryState.value) : []),
    [queryState.value]
  );
  return (
    <Popover
      captureDismiss={true}
      isOpen={isOpen}
      onClose={close}
      onOpened={open}
      minimal={true}
      position={PopoverPosition.BOTTOM}
      content={
        <Menu>
          {items.map((t, i) => (
            <MenuItem
              text={t}
              active={activeIndex === i}
              key={i}
              popoverProps={{
                captureDismiss: true,
              }}
              onClick={() => {
                setQueryState({
                  type: queryState.type,
                  value: items[i],
                  key: queryState.key,
                });
                close();
              }}
            />
          ))}
        </Menu>
      }
      target={
        <InputGroup
          value={queryState.value || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQueryState({
              type: queryState.type,
              value: e.target.value,
              key: queryState.key,
            });
            setIsOpen(!!e.target.value);
          }}
          placeholder={"Search for a page"}
          style={{ marginLeft: 8 }}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              setActiveIndex((activeIndex + 1) % items.length);
              e.preventDefault();
            } else if (e.key === "ArrowUp") {
              setActiveIndex((activeIndex + items.length - 1) % items.length);
              e.preventDefault();
            } else if (e.key === "Enter" && items.length > 0) {
              setQueryState({
                type: queryState.type,
                value: items[activeIndex],
                key: queryState.key,
              });
              close();
              e.preventDefault();
            }
          }}
          onBlur={close}
        />
      }
    />
  );
};

const SubqueryContent = ({
  value,
  onChange,
  level,
  onDelete,
}: {
  value: QueryState;
  onChange: (e: QueryState) => void;
  level: number;
  onDelete?: () => void;
}) => {
  const [key, setKey] = useState(0);
  const incrementKey = useCallback(() => {
    setKey(key + 1);
    return key + 1;
  }, [key, setKey]);
  const [queryState, setQueryState] = useState<QueryState>(value);
  useEffect(() => {
    if (!areEqual(value, queryState)) {
      onChange(queryState);
    }
  }, [queryState, onChange, value]);
  const onItemSelect = useCallback(
    (item) =>
      setQueryState({
        ...(item === NODES.TAG
          ? { value: queryState.value || "" }
          : { children: queryState.children || [] }),
        type: item,
        key: queryState.key,
      }),
    [setQueryState, queryState]
  );
  const onSelectKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "a") {
        onItemSelect(NODES.AND);
      } else if (e.key === "o") {
        onItemSelect(NODES.OR);
      } else if (e.key === "b") {
        onItemSelect(NODES.BETWEEN);
      } else if (e.key === "t" && level > 0) {
        onItemSelect(NODES.TAG);
      } else if (e.key === "n" && level > 0) {
        onItemSelect(NODES.NOT);
      }
    },
    [onItemSelect, level]
  );
  const onContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!!onDelete && e.key === "Backspace" && isControl(e.nativeEvent)) {
        onDelete();
        e.stopPropagation();
      }
    },
    [onDelete]
  );
  const onAddChild = useCallback(
    () =>
      setQueryState({
        type: queryState.type,
        children: [
          ...queryState.children,
          { type: NODES.TAG, children: [], key: incrementKey() },
        ],
        key: queryState.key,
      }),
    [setQueryState, incrementKey, queryState]
  );
  const addChildButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <div onKeyDown={onContainerKeyDown}>
      <div style={{ marginBottom: 8 }}>
        <NodeSelect
          items={[
            ...(level === 0 ? [] : [NODES.TAG, NODES.NOT]),
            NODES.AND,
            NODES.OR,
            NODES.BETWEEN,
          ]}
          onItemSelect={onItemSelect}
          itemRenderer={(item, { modifiers, handleClick }) => (
            <MenuItem
              key={item}
              text={item}
              active={modifiers.active}
              onClick={handleClick}
            />
          )}
          filterable={false}
          popoverProps={{ minimal: true, captureDismiss: true }}
        >
          <Button
            text={queryState.type}
            rightIcon="double-caret-vertical"
            autoFocus={true}
            onKeyDown={onSelectKeyDown}
          />
        </NodeSelect>
        {queryState.type === NODES.TAG && (
          <PageInput queryState={queryState} setQueryState={setQueryState} />
        )}
        {!!onDelete && (
          <Icon
            icon={"trash"}
            onClick={onDelete}
            style={{
              cursor: "pointer",
              marginLeft: 16,
            }}
          />
        )}
      </div>
      {queryState.type !== NODES.TAG && (
        <div
          style={{
            padding: 8,
            borderLeft: `1px solid ${colors[level % colors.length]}`,
          }}
        >
          {queryState.children.map((q, i) => (
            <SubqueryContent
              value={q}
              onChange={(newQ) => {
                const children = queryState.children;
                children[i] = newQ;
                setQueryState({
                  type: queryState.type,
                  key: queryState.key,
                  children,
                });
              }}
              level={level + 1}
              key={q.key}
              onDelete={() => {
                const children = queryState.children;
                if (i === children.length - 1) {
                  addChildButtonRef.current.focus();
                }
                delete children[i];
                setQueryState({
                  type: queryState.type,
                  key: queryState.key,
                  children: children.filter((c) => !!c),
                });
              }}
            />
          ))}
          <Button
            icon={"plus"}
            text="Add Child"
            onClick={onAddChild}
            style={{ marginTop: 8 }}
            elementRef={addChildButtonRef}
          />
        </div>
      )}
    </div>
  );
};

const QueryContent = ({ blockId }: { blockId: string }) => {
  const [queryState, setQueryState] = useState<QueryState>({
    type: NODES.AND,
    children: [],
    key: 0,
  });
  const onSave = useCallback(async () => {
    const outputText = `{{[[query]]: ${toQueryString(queryState)}}}`;
    await openBlock(document.getElementById(blockId));
    await userEvent.clear(document.activeElement);
    await asyncType(outputText);
  }, [queryState]);

  return (
    <div style={{ padding: 16 }}>
      <SubqueryContent value={queryState} onChange={setQueryState} level={0} />
      <div style={{ paddingTop: 16 }}>
        <Button text="Save" onClick={onSave} />
      </div>
    </div>
  );
};

const QueryBuilder = ({ blockId }: { blockId: string }) => {
  return (
    <Popover
      content={<QueryContent blockId={blockId} />}
      target={<Button text="QUERY" />}
      defaultIsOpen={true}
    />
  );
};

export default (blockId: string) => <QueryBuilder blockId={blockId} />;
