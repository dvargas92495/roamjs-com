import React, { useCallback, useState } from "react";
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
      <div style={{ paddingLeft: 4, borderLeft: "1px solid red" }}>
        <NodeSelect
          items={[NODES.OR, NODES.AND, NODES.BETWEEN]}
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
