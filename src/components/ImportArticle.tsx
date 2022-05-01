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
  createBlock,
  getTreeByPageName,
  getUidsFromId,
  InputTextNode,
  updateBlock,
  getParentUidByBlockUid,
  getOrderByBlockUid,
} from "roam-client";
import axios from "axios";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import charset from "charset";

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
  onSuccess,
}: {
  url: string;
  blockUid?: string;
  indent: boolean;
  onSuccess?: () => void;
}): Promise<InputTextNode[]> =>
  axios
    .post(
      `https://lambda.roamjs.com/article`,
      { url },
      { headers: { "Content-Type": "application/json" } }
    )
    .then(async (r) => {
      if (onSuccess) {
        onSuccess();
      }
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
      const stack: InputTextNode[] = [];
      const inputTextNodes: InputTextNode[] = [];
      const markdown = td.turndown(content);
      const nodes = markdown.split("\n").filter((c) => !!c.trim());
      let previousNodeTabbed = false;
      for (const node of nodes) {
        const isHeader = /^#{1,3} /.test(node);
        const isBullet = node.startsWith("* ");
        const bulletText = isBullet ? node.substring(2).trim() : node;
        const text = isHeader ? bulletText.replace(/^#+ /, "") : bulletText;
        const heading = isHeader ? node.split(" ")[0].length : 0;
        if (isHeader && indent) {
          stack.pop();
        }
        if (isBullet && !previousNodeTabbed) {
          const children = stack[stack.length - 1]?.children || inputTextNodes;
          stack.push(children.slice(-1)[0]);
        }
        const children = stack[stack.length - 1]?.children || inputTextNodes;
        const inputTextNode: InputTextNode = { text, heading, children: [] };
        children.push(inputTextNode);
        if (isBullet && !previousNodeTabbed) {
          stack.pop();
        }
        if (indent && isHeader) {
          stack.push(inputTextNode);
          previousNodeTabbed = true;
        } else {
          previousNodeTabbed = false;
        }
      }
      if (blockUid) {
        clearBlockByUid(blockUid);
        updateBlock({ ...inputTextNodes[0], uid: blockUid });
        inputTextNodes[0].children.forEach((node, order) =>
          createBlock({ node, order, parentUid: blockUid })
        );
        const parentUid = getParentUidByBlockUid(blockUid);
        const order = getOrderByBlockUid(blockUid);
        inputTextNodes
          .slice(1)
          .forEach((node, o) =>
            createBlock({ node, order: o + order + 1, parentUid })
          );
      }
      return inputTextNodes;
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
    importArticle({ url: value, blockUid, indent, onSuccess: close }).catch(
      () => {
        setError(ERROR_MESSAGE);
        setLoading(false);
      }
    );
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
  const config = getTreeByPageName("roam/js/article");
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
