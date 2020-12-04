import ReactDOM from "react-dom";
import React, { ChangeEvent, useCallback, useState } from "react";
import {
  Button,
  Icon,
  InputGroup,
  Popover,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { asyncType, newBlockEnter, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const getTextFromNode = (text: string): string =>
  text
    .replace(/&nbsp;/g, "")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, "...")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/&hellip;/g, "...");

const getText = async (text: string) => {
  if (
    text.startsWith("# ") ||
    text.startsWith("## ") ||
    text.startsWith("### ")
  ) {
    const headingIndex = text.indexOf("# ");
    const typeText = text.substring(0, headingIndex + 2);
    const pasteText = text.substring(headingIndex + 2);
    await asyncType(typeText);
    return pasteText;
  }
  return text;
};

const td = new TurndownService();
const ImportContent = ({ blockId }: { blockId: string }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setError("");
    },
    [setValue]
  );
  const importArticle = useCallback(() => {
    setError("");
    setLoading(true);
    axios
      .post(`${process.env.REST_API_URL}/article`, { url: value })
      .then(async (r) => {
        const doc = new DOMParser().parseFromString(
          r.data as string,
          "text/html"
        );
        const { content } = new Readability(doc).parse();
        const textarea = await openBlock(document.getElementById(blockId));
        await userEvent.clear(textarea);
        const markdown = td.turndown(content);
        const nodes = markdown.split("\n").filter((c) => !!c.trim());
        for (const node of nodes) {
          const textarea = document.activeElement as HTMLTextAreaElement;
          const text = await getText(node);
          await userEvent.paste(textarea, text, {
            // @ts-ignore - https://github.com/testing-library/user-event/issues/512
            clipboardData: new DataTransfer(),
          });
          const end = textarea.value.length;
          textarea.setSelectionRange(end, end);
          await newBlockEnter();
        }
      })
      .catch(() => {
        setError("Error Importing Article");
        setLoading(false);
      });
  }, [blockId, value, setError, setLoading]);
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
        <Button
          text={loading ? <Spinner size={20} /> : "IMPORT"}
          onClick={importArticle}
          disabled={loading}
        />
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
