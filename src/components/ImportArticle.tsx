import ReactDOM from "react-dom";
import React, { ChangeEvent, useCallback, useState } from "react";
import { Button, Icon, InputGroup, Popover } from "@blueprintjs/core";
import { asyncType, newBlockEnter, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import parse from "node-html-parser";
import TurndownService from "turndown";

const turndownService = new TurndownService();

const ImportContent = ({ blockId }: { blockId: string }) => {
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const importArticle = useCallback(
    () =>
      axios.get(value).then(async (r) => {
        const root = parse(r.data);
        const article = root.querySelector("article");
        const header = article.querySelector("header");
        const content = header.nextElementSibling;
        await openBlock(document.getElementById(blockId));
        await userEvent.clear(document.activeElement);
        await asyncType("Content:");
        await newBlockEnter();
        await userEvent.tab();
        for (const child of content.childNodes) {
          await asyncType(child.innerText);
          await newBlockEnter();
        }
      }),
    [blockId, value]
  );
  return (
    <div style={{ padding: 16 }}>
      <div>
        <InputGroup
          leftElement={<Icon icon="link" />}
          onChange={onChange}
          placeholder="Enter url..."
          value={value}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              importArticle();
            }
          }}
          width={600}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <Button text={"IMPORT"} onClick={importArticle} />
      </div>
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
