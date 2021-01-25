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
import {
  clearBlockByUid,
  getOrderByBlockUid,
  getUidsFromId,
  getParentUidByBlockUid,
} from "roam-client";
import axios from "axios";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import charset from "charset";
import {
  getNthChildUidByBlockUid,
  getTextTreeByPageName,
} from "../entry-helpers";

export const ERROR_MESSAGE =
  "Error Importing Article. Email link to support@roamjs.com for help!";

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
    return `![${alt
      .replace(/\n/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "")}](${src})`;
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

export const importArticle = ({
  url,
  blockUid,
  indent,
}: {
  url: string;
  blockUid: string;
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
      base.href = url;
      base.target = "_blank";
      const htmlWithBase = `${html.substring(0, headIndex)}${
        base.outerHTML
      }${html.substring(headIndex)}`;
      const doc = new DOMParser().parseFromString(htmlWithBase, "text/html");
      const { content } = new Readability(doc).parse();
      clearBlockByUid(blockUid);
      const parentUid = getParentUidByBlockUid(blockUid);
      const firstOrder = getOrderByBlockUid(blockUid);
      const stack = [{ "parent-uid": parentUid, order: firstOrder }];
      const markdown = td.turndown(content);
      const nodes = markdown.split("\n").filter((c) => !!c.trim());
      let firstHeaderFound = false;
      let previousNodeTabbed = false;
      let bulletIsParagraph = false;
      for (const node of nodes) {
        const isHeader =
          node.startsWith("# ") ||
          node.startsWith("## ") ||
          node.startsWith("### ");
        const isBullet = node.startsWith("* ");
        const text = isBullet ? node.substring(2).trim() : node;
        if (isBullet && previousNodeTabbed) {
          bulletIsParagraph = true;
        }
        if (isHeader) {
          if (indent) {
            if (firstHeaderFound) {
              stack.pop();
              bulletIsParagraph = false;
            } else {
              firstHeaderFound = true;
            }
          }
        }
        const location = stack[stack.length - 1];
        if (isBullet && !bulletIsParagraph) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          const newParentUid = getNthChildUidByBlockUid({
            blockUid: location["parent-uid"],
            order: location["order"],
          });
          stack.push({ order: 0, "parent-uid": newParentUid });
        }
        if (stack.length === 1 && location.order === firstOrder) {
          window.roamAlphaAPI.updateBlock({
            block: { string: text, uid: blockUid },
          });
        } else {
          window.roamAlphaAPI.createBlock({
            block: { string: text },
            location,
          });
        }
        location.order++;
        if (isBullet && !bulletIsParagraph) {
          stack.pop();
        }
        if (indent && isHeader) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          const newParentUid = getNthChildUidByBlockUid({
            blockUid: location["parent-uid"],
            order: location["order"] - 1,
          });
          stack.push({ order: 0, "parent-uid": newParentUid });
          previousNodeTabbed = true;
        } else {
          previousNodeTabbed = false;
        }
      }
    });

const ImportContent = ({
  blockId,
  initialIndent,
  close,
}: {
  blockId: string;
  initialIndent: boolean;
  close: () => void;
}) => {
  const { blockUid } = getUidsFromId(blockId);
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
    importArticle({ url: value, blockUid, indent })
      .then(close)
      .catch(() => {
        setError(ERROR_MESSAGE);
        setLoading(false);
      });
  }, [blockUid, value, indent, setError, setLoading, close]);
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
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      content={
        <ImportContent
          blockId={blockId}
          initialIndent={initialIndent}
          close={close}
        />
      }
      target={
        <Button
          text="IMPORT ARTICLE"
          data-roamjs-import-article
          onClick={open}
        />
      }
      isOpen={isOpen}
      onInteraction={setIsOpen}
    />
  );
};

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
