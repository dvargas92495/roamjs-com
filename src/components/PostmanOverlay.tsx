import { Icon, Popover, Spinner, Text } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { getTreeByBlockUid, TreeNode, TextNode } from "roam-client";

type PostmanProps = {
  apiUid: string;
  blockUid: string;
};

const toTextNode = (t: TreeNode): TextNode => ({
  text: t.text,
  children: t.children.map(toTextNode),
});

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
    const blockTreeText = blockTree.children.map(toTextNode);

    const bodyNode = tree.children.find((t) => /body/i.test(t.text));
    const body = bodyNode
      ? Object.fromEntries(
          bodyNode.children.map((t) => [
            t.text,
            (t.children[0]?.text || "")
              ?.replace("{block}", blockTree.text)
              .replace("{tree}", JSON.stringify(blockTreeText)),
          ])
        )
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
