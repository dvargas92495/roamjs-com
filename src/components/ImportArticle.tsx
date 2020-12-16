import ReactDOM from "react-dom";
import React, { ChangeEvent, useCallback, useState } from "react";
import {
  Button,
  Checkbox,
  Icon,
  InputGroup,
  Label,
  Popover,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { asyncPaste, asyncType, newBlockEnter, openBlock } from "roam-client";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import charset from "charset";
import { createHTMLObserver, getTextTreeByPageName } from "../entry-helpers";

export const ERROR_MESSAGE =
  "Error Importing Article. Email link to support@roamjs.com for help!";

const tabListenerRef: { current: (b: HTMLTextAreaElement) => void } = {
  current: null,
};
const addTabListener = (listener: (b: HTMLTextAreaElement) => void) =>
  (tabListenerRef.current = listener);
createHTMLObserver({
  tag: "TEXTAREA",
  className: "rm-block-input",
  callback: (b) =>
    tabListenerRef.current && tabListenerRef.current(b as HTMLTextAreaElement),
});

const td = new TurndownService({
  hr: "---",
  headingStyle: "atx",
});
td.addRule("img", {
  filter: "img",
  replacement: function (content, node) {
    const img = node as HTMLImageElement;
    const src = img.getAttribute("data-src") || img.getAttribute("src");
    const alt = img.getAttribute("alt") || "";
    return `![${alt.replace(/\n/g, "")}](${src})`;
  },
});
td.addRule("i", {
  filter: ["i", "em"],
  replacement: function (content) {
    return `__${content}__`;
  },
});
td.addRule("h4", {
  filter: ["h4"],
  replacement: function (content) {
    return `### ${content}`;
  },
});
td.addRule("a", {
  filter: (node, options) =>
    options.linkStyle === "inlined" &&
    node.nodeName === "A" &&
    !!node.getAttribute("href"),

  replacement: (content, node) => {
    if (!content) {
      return "";
    }
    const anchor = node as HTMLAnchorElement;
    if (
      anchor.childElementCount === 1 &&
      anchor.children[0].nodeName === "IMG"
    ) {
      return content;
    }
    const href = anchor.getAttribute("href");
    return "[" + content + "](" + href + ")";
  },
});

const tabObj = {
  bubbles: true,
  cancelable: true,
  key: "Tab",
  keyCode: 9,
  code: "Tab",
  which: 9,
};
const shiftTabObj = { ...tabObj, shiftKey: true };
const waitForTab = (id: string) =>
  new Promise((resolve) =>
    addTabListener((b: HTMLTextAreaElement) => {
      if (b.id === id) {
        resolve(id);
      }
    })
  );

export const importArticle = ({
  url,
  blockId,
  indent,
}: {
  url: string;
  blockId: string;
  indent: boolean;
}): Promise<void> =>
  axios
    .post(
      `${process.env.REST_API_URL}/article`,
      { url },
      { headers: { "Content-Type": "application/json" } }
    )
    .then(async (r) => {
      const enc = charset(r.headers) || "utf-8";
      const buffer = iconv.encode(r.data, "base64");
      const html = iconv.decode(buffer, enc);
      const headIndex = html.indexOf("<head>") + "<head>".length;
      const base = document.createElement("base");
      base.href = new URL(url).origin;
      base.target = "_blank";
      const htmlWithBase = `${html.substring(0, headIndex)}${
        base.outerHTML
      }${html.substring(headIndex)}`;
      const doc = new DOMParser().parseFromString(htmlWithBase, "text/html");
      const { content } = new Readability(doc).parse();
      const textarea = await openBlock(document.getElementById(blockId));
      await userEvent.clear(textarea);
      const markdown = td.turndown(content);
      const nodes = markdown.split("\n").filter((c) => !!c.trim());
      let firstHeaderFound = false;
      for (const node of nodes) {
        const isHeader =
          node.startsWith("# ") ||
          node.startsWith("## ") ||
          node.startsWith("### ");
        const isBullet = node.startsWith("* ");
        const text = isHeader
          ? node.substring(node.indexOf("# ") + 2)
          : isBullet
          ? node.substring(2).trim()
          : node;
        if (isHeader) {
          if (indent) {
            if (firstHeaderFound) {
              document.activeElement.dispatchEvent(
                new KeyboardEvent("keydown", shiftTabObj)
              );
              await waitForTab(document.activeElement.id);
            } else {
              firstHeaderFound = true;
            }
          }
          await asyncType(node.substring(0, node.indexOf("# ") + 2));
        }
        if (isBullet) {
          document.activeElement.dispatchEvent(
            new KeyboardEvent("keydown", tabObj)
          );
          await waitForTab(document.activeElement.id);
        }
        await asyncPaste(text);
        await newBlockEnter();
        if (isBullet) {
          document.activeElement.dispatchEvent(
            new KeyboardEvent("keydown", shiftTabObj)
          );
          await waitForTab(document.activeElement.id);
        }
        if (indent && isHeader) {
          document.activeElement.dispatchEvent(
            new KeyboardEvent("keydown", tabObj)
          );
          await waitForTab(document.activeElement.id);
        }
      }
    });

const ImportContent = ({
  blockId,
  initialIndent,
}: {
  blockId: string;
  initialIndent: boolean;
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(initialIndent);
  const [loading, setLoading] = useState(false);
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setError("");
    },
    [setValue]
  );
  const importArticleCallback = useCallback(() => {
    if (!value.startsWith("https://") && !value.startsWith("http://")) {
      setError("Link must start with https:// protocol!");
      return;
    }
    setError("");
    setLoading(true);
    importArticle({ url: value, blockId, indent }).catch(() => {
      setError(ERROR_MESSAGE);
      setLoading(false);
    });
  }, [blockId, value, indent, setError, setLoading]);
  const indentOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setIndent(e.target.checked),
    [setIndent]
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
              importArticleCallback();
            }
          }}
          width={1000}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <Label>
          Indent Under Header
          <Checkbox checked={indent} onChange={indentOnChange} />
        </Label>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button
          text={loading ? <Spinner size={20} /> : "IMPORT"}
          onClick={importArticleCallback}
          disabled={loading}
        />
        <Text>{error}</Text>
      </div>
    </div>
  );
};

const ImportArticle = ({
  blockId,
  initialIndent,
}: {
  blockId: string;
  initialIndent: boolean;
}): JSX.Element => (
  <Popover
    content={<ImportContent blockId={blockId} initialIndent={initialIndent} />}
    target={<Button text="IMPORT ARTICLE" data-roamjs-import-article />}
    defaultIsOpen={true}
  />
);

export const getIndentConfig = (): boolean => {
  const config = getTextTreeByPageName("roam/js/article");
  return config.some(
    (s) => s.text.trim().toUpperCase() === "INDENT UNDER HEADER"
  );
};

export const renderImportArticle = (blockId: string, p: HTMLElement): void =>
  ReactDOM.render(
    <ImportArticle blockId={blockId} initialIndent={getIndentConfig()} />,
    p
  );

export default ImportArticle;
