import React, { useCallback, useEffect, useState } from "react";
import { Button, MenuItem, Popover } from "@blueprintjs/core";
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

type QueryState = {
  type: NODES;
  children: QueryState[];
};

const toQueryString = (queryState: QueryState) => {
  const operator = queryState.type.toLocaleString().toLowerCase();
  return `${operator}:{}`;
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
    onChange(queryState);
  }, [queryState, onChange]);
  return (
    <div
      style={{
        paddingLeft: 4,
        borderLeft: `1px solid ${colors[level % colors.length]}`,
      }}
    >
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
              type: item,
              children: queryState.children,
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
      {queryState.children.map((q, i) => (
        <SubqueryContent
          value={q}
          onChange={(newQ) => {
            const children = queryState.children;
            children[i] = newQ;
            setQueryState({
              type: queryState.type,
              children,
            });
          }}
          level={level + 1}
        />
      ))}
      <div>
        <Button
          icon={"plus"}
          text="Add Child"
          onClick={() =>
            setQueryState({
              type: queryState.type,
              children: [
                ...queryState.children,
                { type: NODES.OR, children: [] },
              ],
            })
          }
        />
      </div>
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
