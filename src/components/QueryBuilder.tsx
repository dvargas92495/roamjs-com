import React, { useCallback, useEffect, useState } from "react";
import { Button, MenuItem, Popover, InputGroup } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { asyncType, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";

enum NODES {
  OR = "OR",
  AND = "AND",
  NOT = "NOT",
  BETWEEN = "BETWEEN",
  TAG = "TAG",
}

const NodeSelect = Select.ofType<NODES>();

type Node = {
  type: NODES;
};

type Leaf = Node & {
  value: string;
};

type Parent = Node & {
  children: QueryState[];
};

type QueryState = Leaf | Parent;

const toQueryString = (queryState: QueryState): string => {
  if (queryState.type === NODES.TAG) {
    return (queryState as Leaf).value;
  } else {
    const operator = queryState.type.toLocaleString().toLowerCase();
    const children = (queryState as Parent).children
      .map((q) => toQueryString(q))
      .join(" ");
    return `${operator}:{${children}}`;
  }
};

const areEqual = (a: QueryState, b: QueryState): boolean => {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === NODES.TAG) {
    return (a as Leaf).value === (b as Leaf).value;
  }
  const aChildren = (a as Parent).children;
  const bChildren = (b as Parent).children;
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
}: {
  value: QueryState;
  onChange: (e: QueryState) => void;
  level: number;
}) => {
  const [queryState, setQueryState] = useState<QueryState>(value);
  useEffect(() => {
    if (!areEqual(value, queryState)) {
      onChange(queryState);
    }
  }, [queryState, onChange, value]);
  return (
    <div>
      <div>
        <NodeSelect
          items={[
            NODES.OR,
            NODES.AND,
            NODES.BETWEEN,
            ...(level === 0 ? [] : [NODES.TAG, NODES.NOT]),
          ]}
          onItemSelect={(item) =>
            setQueryState({
              ...queryState,
              type: item,
            })
          }
          itemRenderer={(item, { modifiers, handleClick }) => (
            <MenuItem
              key={item}
              text={item}
              active={modifiers.active}
              onClick={handleClick}
            />
          )}
          filterable={false}
          popoverProps={{ minimal: true }}
        >
          <Button
            text={queryState.type}
            rightIcon="double-caret-vertical"
            autoFocus={true}
          />
        </NodeSelect>
      </div>
      {queryState.type === NODES.TAG ? (
        <InputGroup
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQueryState({
              type: queryState.type,
              value: e.target.value,
            })
          }
        />
      ) : (
        <div
          style={{
            padding: 8,
            borderLeft: `1px solid ${colors[level % colors.length]}`,
          }}
        >
          {(queryState as Parent).children.map((q, i) => (
            <SubqueryContent
              value={q}
              onChange={(newQ) => {
                const children = (queryState as Parent).children;
                children[i] = newQ;
                setQueryState({
                  type: queryState.type,
                  children,
                });
              }}
              level={level + 1}
              key={i}
            />
          ))}
          <Button
            icon={"plus"}
            text="Add Child"
            onClick={() =>
              setQueryState({
                type: queryState.type,
                children: [
                  ...(queryState as Parent).children,
                  { type: NODES.OR, children: [] },
                ],
              })
            }
          />
        </div>
      )}
    </div>
  );
};

const QueryContent = ({ blockId }: { blockId: string }) => {
  const [queryState, setQueryState] = useState<QueryState>({
    type: NODES.OR,
    children: [],
  });
  const onSave = useCallback(async () => {
    const outputText = `{{[[query]]: {${toQueryString(queryState)}}}}`;
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
    />
  );
};

export default (blockId: string) => <QueryBuilder blockId={blockId} />;
