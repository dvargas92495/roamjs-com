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
import ReactDOM from "react-dom";
import DemoPopoverWrapper from "./DemoPopoverWrapper";
import { useArrowKeyDown } from "./hooks";

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
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const items = useMemo(
    () => (queryState.value ? searchPagesByString(queryState.value) : []),
    [queryState.value]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeIndex, onKeyDown } = useArrowKeyDown({
    onEnter: (value) => {
      setQueryState({
        type: queryState.type,
        value,
        key: queryState.key,
      });
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
      position={PopoverPosition.BOTTOM}
      content={
        <Menu>
          {items.map((t, i) => (
            <MenuItem
              text={t}
              active={activeIndex === i}
              key={i}
              onClick={() => {
                setQueryState({
                  type: queryState.type,
                  value: items[i],
                  key: queryState.key,
                });
                close();
                inputRef.current.focus();
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
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (e.relatedTarget) {
              close();
            }
          }}
          inputRef={inputRef}
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

const toQueryStateChildren = (v: string): QueryState[] => {
  let inParent = 0;
  let inTag = 0;
  let inHashTag = false;
  const children = [];
  let content = "";
  for (let pointer = 0; pointer < v.length; pointer++) {
    const c = v.charAt(pointer);
    if (c === "{") {
      inParent++;
    } else if (
      !inTag &&
      ((c === "#" &&
        v.charAt(pointer + 1) === "[" &&
        v.charAt(pointer + 2) === "[") ||
        (c === "[" && v.charAt(pointer + 1) === "["))
    ) {
      inTag++;
    } else if (!inHashTag && c === "#") {
      inHashTag = true;
    }
    if (inParent || inTag || inHashTag) {
      content = `${content}${c}`;
    }
    if (c === "}") {
      inParent--;
      if (inParent === 0) {
        children.push({ ...toQueryState(content.trim()), key: children.length });
      }
    } else if (c === "]" && v.charAt(pointer + 1) === "]") {
      inTag--;
      if (inTag === 0) {
        children.push({ ...toQueryState(content.trim()), key: children.length });
      }
    } else if (inHashTag && c === " ") {
      inHashTag = false;
      children.push({ ...toQueryState(content.trim()), key: children.length });
    }
  }

  return children;
};

const toQueryState = (v: string): QueryState => {
  if (!v) {
    return {
      type: NODES.AND,
      children: [] as QueryState[],
      key: 0,
    };
  }
  if (v.startsWith("{{query:")) {
    const content = v.substring("{{query:".length, v.length - "}}".length);
    return toQueryState(content.trim());
  } else if (v.startsWith("{and:")) {
    const andContent = v.substring("{and:".length, v.length - "}".length);
    const children = toQueryStateChildren(andContent.trim());
    return {
      type: NODES.AND,
      children,
      key: 0,
    };
  } else if (v.startsWith("{or:")) {
    const orContent = v.substring("{or:".length, v.length - "}".length);
    const children = toQueryStateChildren(orContent.trim());
    return {
      type: NODES.OR,
      children,
      key: 0,
    };
  } else if (v.startsWith("{between:")) {
    const betweenContent = v.substring(
      "{between:".length,
      v.length - "}".length
    );
    const children = toQueryStateChildren(betweenContent.trim());
    return {
      type: NODES.BETWEEN,
      children,
      key: 0,
    };
  } else if (v.startsWith("{not:")) {
    const notContent = v.substring("{not:".length, v.length - "}".length);
    const children = toQueryStateChildren(notContent.trim());
    return {
      type: NODES.NOT,
      children,
      key: 0,
    };
  } else if (v.startsWith("#[[")) {
    const value = v.substring("#[[".length, v.length - "]]".length);
    return {
      type: NODES.TAG,
      value,
      key: 0,
    };
  } else if (v.startsWith("[[")) {
    const value = v.substring("[[".length, v.length - "]]".length);
    return {
      type: NODES.TAG,
      value,
      key: 0,
    };
  } else if (v.startsWith("#")) {
    const value = v.substring("#".length);
    return {
      type: NODES.TAG,
      value,
      key: 0,
    };
  } else {
    return {
      type: NODES.AND,
      children: [] as QueryState[],
      key: 0,
    };
  }
};

const QueryContent = ({
  blockId,
  initialValue,
}: {
  blockId: string;
  initialValue: string;
}) => {
  const [queryState, setQueryState] = useState<QueryState>(
    toQueryState(initialValue)
  );
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

const QueryBuilder = ({
  blockId,
  defaultIsOpen,
  initialValue = "",
}: {
  blockId: string;
  defaultIsOpen: boolean;
  initialValue?: string;
}) => {
  return (
    <Popover
      content={<QueryContent blockId={blockId} initialValue={initialValue} />}
      target={
        <Button
          text={initialValue ? <Icon icon={"edit"} /> : "QUERY"}
          id={`roamjs-query-builder-button-${blockId}`}
        />
      }
      defaultIsOpen={defaultIsOpen}
    />
  );
};

export const renderQueryBuilder = ({
  blockId,
  parent,
  initialValue,
}: {
  blockId: string;
  parent: HTMLElement;
  initialValue?: string;
}) =>
  ReactDOM.render(
    <QueryBuilder
      blockId={blockId}
      defaultIsOpen={!initialValue}
      initialValue={initialValue}
    />,
    parent
  );

export const DemoQueryBuilder = () => {
  useEffect(() => {
    window.roamAlphaAPI = {
      q: () => [
        [{ title: "David" }],
        [{ title: "Anthony" }],
        [{ title: "Vargas" }],
      ],
      pull: () => ({
        ":block/children": [],
        ":block/string": "",
      }),
    };
  }, []);
  return (
    <DemoPopoverWrapper
      WrappedComponent={QueryBuilder}
      placeholder={"Saved query text outputted here!"}
    />
  );
};

export default QueryBuilder;
