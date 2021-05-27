import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  MenuItem,
  Popover,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import {
  getUidsFromId,
  getTextByBlockUid,
} from "roam-client";
import { Icon } from "@blueprintjs/core";
import { isControl } from "../entry-helpers";
import ReactDOM from "react-dom";
import DemoPopoverWrapper from "./DemoPopoverWrapper";
import PageInput from "./PageInput";

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
  const [key, setKey] = useState(value.children?.length || 0);
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
          <span style={{ marginLeft: 8 }}>
            <PageInput
              value={queryState.value}
              setValue={(value) =>
                setQueryState({
                  type: queryState.type,
                  value,
                  key: queryState.key,
                })
              }
            />
          </span>
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
    } else if (!inHashTag && c === "#" && !inTag) {
      inHashTag = true;
    }
    if (inParent || inTag || inHashTag) {
      content = `${content}${c}`;
    }
    if (inParent > 0 && c === "}") {
      inParent--;
    } else if (inTag > 0 && c === "]" && v.charAt(pointer - 1) === "]") {
      inTag--;
    } else if (inHashTag && /(\s|\])/.test(c)) {
      inHashTag = false;
    }
    if (inParent === 0 && inTag === 0 && !inHashTag && content) {
      children.push({ ...toQueryState(content.trim()), key: children.length });
      content = "";
    }
  }

  return children;
};

const QUERY_REGEX = /{{(?:query|\[\[query\]\]):(.*)}}/;
const toQueryState = (v: string): QueryState => {
  if (!v) {
    return {
      type: NODES.AND,
      children: [] as QueryState[],
      key: 0,
    };
  }
  if (QUERY_REGEX.test(v)) {
    const content = v.match(QUERY_REGEX)[1];
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
  close,
}: {
  blockId: string;
  initialValue: string;
  close: () => void;
}) => {
  const [queryState, setQueryState] = useState<QueryState>(
    toQueryState(initialValue)
  );
  const onSave = useCallback(async () => {
    const outputText = `{{[[query]]: ${toQueryString(queryState)}}}`;
    const { blockUid } = getUidsFromId(blockId);
    const text = getTextByBlockUid(blockUid);
    const newText = initialValue
      ? text.replace(initialValue, outputText)
      : text.replace(/{{(qb|query builder)}}/, outputText);
    window.roamAlphaAPI.updateBlock({
      block: { string: newText, uid: blockUid },
    });
    close();
  }, [queryState, close, initialValue]);

  return (
    <div style={{ padding: 16, maxHeight: "75vh", overflowY: "scroll" }}>
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
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      content={
        <QueryContent
          blockId={blockId}
          initialValue={initialValue}
          close={close}
        />
      }
      target={
        <Button
          text={initialValue ? <Icon icon={"edit"} /> : "QUERY"}
          id={`roamjs-query-builder-button-${blockId}`}
          onClick={open}
        />
      }
      isOpen={isOpen}
      onInteraction={setIsOpen}
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
}): void =>
  ReactDOM.render(
    <QueryBuilder
      blockId={blockId}
      defaultIsOpen={!initialValue}
      initialValue={initialValue}
    />,
    parent
  );

export const DemoQueryBuilder = (): JSX.Element => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.roamAlphaAPI = {
      q: () => [
        [{ title: "David" }],
        [{ title: "Anthony" }],
        [{ title: "Vargas" }],
      ],
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
