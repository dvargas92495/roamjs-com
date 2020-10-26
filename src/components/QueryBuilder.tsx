import React, { useCallback, useState } from "react";
import { Button, Popover } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { asyncType, openBlock } from "roam-client";

enum NODES {
  OR,
  AND,
  NOT,
  BETWEEN,
  TAG,
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
    await asyncType(outputText);
  }, [queryState]);

  return (
    <div style={{ padding: 16 }}>
      <NodeSelect
        items={[NODES.OR, NODES.AND, NODES.BETWEEN]}
        onItemSelect={(item) =>
          setQueryState({
            type: item,
            children: queryState.children,
          })
        }
        itemRenderer={(item) => <span>{item}</span>}
      >
        <Button
          text={queryState.type}
          rightIcon="double-caret-vertical"
          autoFocus={true}
        />
      </NodeSelect>
      <Button text="Save" onClick={onSave} />
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
