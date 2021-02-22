import { Icon, Popover, Spinner, Text } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { getTreeByBlockUid, TreeNode, TextNode } from "roam-client";
import { createTagRegex, extractTag } from "../entry-helpers";
import marked from "roam-marked";

type PostmanProps = {
  apiUid: string;
  blockUid: string;
};

const toTextNode = (t: TreeNode): TextNode => ({
  text: t.text,
  children: t.children.map(toTextNode),
});

const toText = ({ t, i }: { t: TreeNode; i: number }): string => {
  const line = `${"".padEnd(i * 2, " ")}${t.text}\n`;
  const lines = t.children.map(c => toText({ t: c, i: i + 1 })).join("");
  return `${line}${lines}`;
};

const toHtml = ({ t }: { t: TreeNode }): string => {
  const html = marked(t.text);
  if (t.children.length) {
    const ul = `<ul>${t.children.map(
      (c) => `<li>${toHtml({ t: c })}</li>`
    )}</ul>`;
    return `${html}${ul}`;
  }
  return html;
};

const convertTextToValue = ({
  text,
  blockTree,
  tag,
}: {
  text: string;
  blockTree: { text: string; children: TreeNode[] };
  tag: string;
}): string =>
  text
    ?.replace(/{block(:clean)?}/i, (_, clean) =>
      clean
        ? blockTree.text.replace(createTagRegex(extractTag(tag)), "")
        : blockTree.text
    )
    .replace(/{tree(?::(text|html))?}/i, (_, f) => {
      const format = f?.toUpperCase?.();
      if (format === "HTML") {
        return `<ul>${blockTree.children.map((t) => toHtml({ t }))}</ul>`;
      } else if (format === "TEXT") {
        return blockTree.children.map((t) => toText({ t, i: 0 })).join("");
      } else {
        return JSON.stringify(blockTree.children.map(toTextNode));
      }
    })
    .trim();

type BodyValue = string | boolean | Record<string, unknown> | number;

const convertNodeToValue = ({
  t,
  defaultType,
  blockTree,
  tag,
}: {
  t: TextNode;
  defaultType: string;
  blockTree: { text: string; children: TreeNode[] };
  tag: string;
}): BodyValue | Array<BodyValue> => {
  const valueType =
    /{(string|number|boolean|object|array)}/i.exec(t.text)?.[1] || defaultType;
  if (valueType === "string") {
    return convertTextToValue({ text: t.text, blockTree, tag }).replace(
      /{string}/i,
      ""
    );
  } else if (valueType === "number") {
    return parseInt(
      convertTextToValue({ text: t.text, blockTree, tag }).replace(
        /{number}/i,
        ""
      )
    );
  } else if (valueType === "boolean") {
    return (
      convertTextToValue({ text: t.text, blockTree, tag }).replace(
        /{boolean}/i,
        ""
      ) === "true"
    );
  } else if (valueType === "object") {
    return Object.fromEntries(
      t.children.map((c) => [
        c.text,
        convertNodeToValue({
          t: c.children[0],
          blockTree,
          tag,
          defaultType: "string",
        }),
      ])
    );
  } else if (valueType === "array") {
    return t.children.map((c) =>
      convertNodeToValue({ t: c, defaultType: "string", blockTree, tag })
    ) as BodyValue[];
  } else {
    return "";
  }
};

const PostmanOverlay: React.FunctionComponent<PostmanProps> = ({
  apiUid,
  blockUid,
}) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const fail = useCallback(
    (msg: string) => {
      setIsError(true);
      setMessage(msg);
      setTimeout(() => setIsOpen(false), 10000);
    },
    [setIsError, setMessage, setIsOpen]
  );
  const onClick = useCallback(() => {
    setIsOpen(true);
    const tree = getTreeByBlockUid(apiUid);
    const urlNode = tree.children.find((t) => /url/i.test(t.text));
    if (!urlNode) {
      fail(`No URL configured for API ${tree.text}`);
    }
    const url = urlNode.children[0].text.trim();
    const blockTree = getTreeByBlockUid(blockUid);

    const bodyNode = tree.children.find((t) => /body/i.test(t.text));
    const body = bodyNode
      ? convertNodeToValue({
          t: bodyNode,
          defaultType: "object",
          blockTree,
          tag: tree.text,
        })
      : {};
    const headersNode = tree.children.find((t) => /headers/i.test(t.text));
    const headers = headersNode
      ? Object.fromEntries(
          headersNode.children.map((t) => [t.text, t.children[0].text])
        )
      : {};

    setLoading(true);
    axios
      .post(url, body, { headers })
      .then((r) => {
        setMessage(`Success! Response: ${JSON.stringify(r.data, null, 4)}`);
        setIsError(false);
        setTimeout(() => setIsOpen(false), 10000);
      })
      .catch((e) => fail(e.response?.data || e.message))
      .finally(() => setLoading(false));
  }, [setIsOpen, setLoading, setIsError, setMessage]);
  return (
    <Popover
      target={
        <Icon
          icon={"send-message"}
          onClick={onClick}
          style={{ marginLeft: 8 }}
        />
      }
      content={
        <div style={{ padding: 16 }}>
          {loading ? (
            <Spinner />
          ) : (
            <div
              style={{
                color: isError ? "darkred" : "darkgreen",
                whiteSpace: "pre-wrap",
                maxWidth: 600,
              }}
            >
              <Text>{message}</Text>
            </div>
          )}
        </div>
      }
      isOpen={isOpen}
      onInteraction={setIsOpen}
    />
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & PostmanProps): void =>
  ReactDOM.render(<PostmanOverlay {...props} />, p);

export default PostmanOverlay;
