import ReactDOM from "react-dom";
import React, { ChangeEvent, useCallback, useState } from "react";
import { Button, Icon, InputGroup, Popover, Text } from "@blueprintjs/core";
import { asyncType, newBlockEnter, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import {
  parse,
  HTMLElement as ParsedHTMLElement,
  Node as ParsedNode,
} from "node-html-parser";

const getTextFromNode = (e: ParsedNode): string => {
  if (e.childNodes.length === 0) {
    return e.innerText.replace(/&nbsp;/g, "");
  }

  const element = e as ParsedHTMLElement;
  const children = element.childNodes.map((c) => getTextFromNode(c)).join("");
  if (element.rawTagName === "p") {
    return children;
  } else if (element.rawTagName === "em") {
    return `__${children}__`;
  } else {
    console.warn("unsupported raw tag", element.rawTagName);
    return children;
  }
};

const ImportContent = ({ blockId }: { blockId: string }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setError("");
    },
    [setValue]
  );
  const importArticle = useCallback(() => {
    setError("");
    axios
      .post(`${process.env.REST_API_URL}/article`, { url: value })
      .then(async (r) => {
        const root = parse(r.data);
        const article = root.querySelector("article");
        const header = article.querySelector("header");
        const content = header.nextElementSibling;
        await openBlock(document.getElementById(blockId));
        await userEvent.clear(document.activeElement);
        await asyncType("Content:");
        await newBlockEnter();
        await userEvent.tab();
        const nodes = content.childNodes.filter((c) => c.innerText !== "\n");
        for (const child of nodes) {
          await asyncType(getTextFromNode(child));
          await newBlockEnter();
        }
      })
      .catch(() => setError("Error Importing Article"));
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
        <Text>{error}</Text>
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
