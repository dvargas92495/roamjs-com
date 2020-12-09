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
import iconv from "iconv-lite";
import charset from "charset";

export const ERROR_MESSAGE =
  "Error Importing Article. Email link to support@roamjs.com for help!";

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
    return `![${alt}](${src})`;
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
    var href = anchor.getAttribute("href");
    return "[" + content + "](" + href + ")";
  },
});

export const importArticle = ({
  url,
  blockId,
}: {
  url: string;
  blockId: string;
}) =>
  axios
    .post(
      `${process.env.REST_API_URL}/article`,
      { url },
      { headers: { "Content-Type": "application/json" } }
    )
    .then(async (r) => {
      const enc = charset(r.headers) || "utf-8";
      const buffer = iconv.encode(r.data, "base64");
      const doc = new DOMParser().parseFromString(
        iconv.decode(buffer, enc),
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
        await newBlockEnter();
      }
    });

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
  const importArticleCallback = useCallback(() => {
    if (!value.startsWith("https://") && !value.startsWith("http://")) {
      setError("Link must start with https:// protocol!");
      return;
    }
    setError("");
    setLoading(true);
    importArticle({ url: value, blockId }).catch(() => {
      setError(ERROR_MESSAGE);
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
              importArticleCallback();
            }
          }}
          width={1000}
        />
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
