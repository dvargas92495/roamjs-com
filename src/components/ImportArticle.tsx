import ReactDOM from "react-dom";
import React, { ChangeEvent, useCallback, useState } from "react";
import { Button, Icon, InputGroup, Popover } from "@blueprintjs/core";
import { asyncType, newBlockEnter, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";

const ImportContent = ({ blockId }: { blockId: string }) => {
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const importArticle = useCallback(async () => {
    await openBlock(document.getElementById(blockId));
    await userEvent.clear(document.activeElement);
    await asyncType("Content:");
    await newBlockEnter();
    await userEvent.tab();
    await asyncType(value);
  }, [blockId, value]);
  return (
    <div style={{ padding: 16 }}>
      <div>
        <InputGroup
          leftElement={<Icon icon="link" />}
          onChange={onChange}
          placeholder="Enter url..."
          value={value}
          autoFocus={true}
          type={"search"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              importArticle();
            }
          }}
        />
      </div>
      <Button text={"IMPORT"} onClick={importArticle} />
    </div>
  );
};

const ImportArticle = ({ blockId }: { blockId: string }) => (
  <Popover
    content={<ImportContent blockId={blockId} />}
    target={<Button text="IMPORT ARTICLE" data-roamjs-import-article />}
    defaultIsOpen={true}
  />
);

export const renderImportArticle = (blockId: string, p: HTMLElement) =>
  ReactDOM.render(<ImportArticle blockId={blockId} />, p);

export default ImportArticle;
