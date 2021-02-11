import {
  Button,
  Icon,
  Popover,
  Portal,
  Spinner,
  Text,
} from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  generateBlockUid,
  getUids,
} from "roam-client";
import { API_URL, getSettingValueFromTree } from "./hooks";
import axios from "axios";

const TwitterContent: React.FunctionComponent<{
  blockUid: string;
  close: () => void;
}> = ({ close, blockUid }) => {
  const message = getTreeByBlockUid(blockUid).children.map((t) => ({
    content: t.text,
    uid: t.uid,
  }));
  const [error, setError] = useState("");
  const [tweetsSent, setTweetsSent] = useState(0);
  const onClick = useCallback(async () => {
    setError("");
    const tree = getTreeByPageName("roam/js/twitter");
    const oauth = getSettingValueFromTree({
      tree,
      key: "oauth",
      defaultValue: "{}",
    });
    if (oauth === "{}") {
      setError(
        "Need to log in with Twitter to send Tweets! Head to roam/js/twitter page to log in."
      );
      return;
    }
    const { oauth_token: key, oauth_token_secret: secret } = JSON.parse(oauth);
    const sentBlockUid = getSettingValueFromTree({
      tree,
      key: "sent",
    })
      .replace("((", "")
      .replace("))", "");
    const sourceUid = generateBlockUid();
    if (sentBlockUid) {
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": sentBlockUid, order: 0 },
        block: {
          string: `Sent at ${new Date().toLocaleString()}`,
          uid: sourceUid,
        },
      });
    }
    let in_reply_to_status_id = 0;
    let name = "";
    let success = true;
    for (let index = 0; index < message.length; index++) {
      setTweetsSent(index + 1);
      const { content, uid } = message[index];
      success = await axios
        .post(`${API_URL}/twitter-tweet`, {
          key,
          secret,
          content: `${in_reply_to_status_id ? `@${name} ` : ""}${content}`,
          in_reply_to_status_id,
        })
        .then((r) => {
          const {
            id_str,
            user: { screen_name },
          } = r.data;
          in_reply_to_status_id = id_str;
          name = screen_name;
          if (sentBlockUid) {
            window.roamAlphaAPI.moveBlock({
              location: { "parent-uid": sourceUid, order: index },
              block: { uid },
            });
          }
          return true;
        })
        .catch((e) => {
          if (sentBlockUid) {
            window.roamAlphaAPI.deleteBlock({ block: { uid: sourceUid } });
          }
          setError(
            e.response?.data?.errors
              ? e.response?.data?.errors
                  .map(({ code }: { code: number }) => {
                    switch (code) {
                      case 220:
                        return "Invalid credentials. Try logging in through the roam/js/twitter page";
                      default:
                        return `Unknown error code (${code}). Email support@roamjs.com for help!`;
                    }
                  })
                  .join("\n")
              : e.message
          );
          setTweetsSent(0);
          return false;
        });
      if (!success) {
        break;
      }
    }
    if (success) {
      close();
    }
  }, [setTweetsSent, close, setError]);
  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      <Button text={`Send Tweet`} onClick={onClick} />
      {tweetsSent > 0 && (
        <div>
          Sending {tweetsSent} of {message.length} tweets.{" "}
          <Spinner size={Spinner.SIZE_SMALL} />
        </div>
      )}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          <Text>{error}</Text>
        </div>
      )}
    </div>
  );
};

const TweetOverlay: React.FunctionComponent<{
  blockUid: string;
  childrenRef: HTMLDivElement;
  unmount: () => void;
}> = ({ childrenRef, blockUid, unmount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const iconRef = useRef(null);
  const calcCounts = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => ({
        count: t.text.length,
        uid: t.uid,
      })),
    [blockUid]
  );
  const calcBlocks = useCallback(
    () =>
      Array.from(childrenRef.children)
        .filter((c) => c.className.includes("roam-block-container"))
        .map(
          (c) =>
            Array.from(c.children).find((c) =>
              c.className.includes("rm-block-main")
            ) as HTMLDivElement
        ),
    [childrenRef]
  );
  const [counts, setCounts] = useState(calcCounts);
  const blocks = useRef(calcBlocks());
  const valid = useMemo(() => counts.every((c) => c.count <= 280), [counts]);
  const open = useCallback(() => setIsOpen(valid), [setIsOpen, valid]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const inputCallback = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const { blockUid: currentUid } = getUids(textarea);
        blocks.current = calcBlocks();
        setCounts(
          calcCounts().map((c) =>
            c.uid === currentUid
              ? { uid: currentUid, count: textarea.value.length }
              : c
          )
        );
      }
    },
    [blockUid, setCounts, calcCounts, calcBlocks, blocks]
  );
  useEffect(() => {
    childrenRef.addEventListener("input", inputCallback);
    return () => childrenRef.removeEventListener("input", inputCallback);
  }, [childrenRef, inputCallback]);
  useEffect(() => {
    if (!document.contains(iconRef.current)) {
      unmount();
    }
  });
  return (
    <>
      <Popover
        target={
          <Icon
            icon={
              <Twitter
                style={{
                  width: 15,
                  marginLeft: 4,
                  cursor: valid ? "pointer" : "not-allowed",
                }}
              />
            }
            onClick={open}
            ref={iconRef}
          />
        }
        content={<TwitterContent blockUid={blockUid} close={close} />}
        isOpen={isOpen}
        onInteraction={setIsOpen}
      />
      {counts
        .filter((_, i) => !!blocks.current[i])
        .map(({ count, uid }, i) => (
          <Portal
            container={blocks.current[i]}
            key={uid}
            className={"roamjs-twitter-count"}
          >
            <span style={{ color: count > 280 ? "red" : "black" }}>
              {count}/280
            </span>
          </Portal>
        ))}
    </>
  );
};

export const render = ({
  parent,
  blockUid,
}: {
  parent: HTMLSpanElement;
  blockUid: string;
}): void => {
  const childrenRef = parent.closest(".rm-block-main")
    ?.nextElementSibling as HTMLDivElement;
  Array.from(
    childrenRef.getElementsByClassName("roamjs-twitter-count")
  ).forEach((s) => s.remove());
  ReactDOM.render(
    <TweetOverlay
      blockUid={blockUid}
      childrenRef={childrenRef}
      unmount={() => ReactDOM.unmountComponentAtNode(parent)}
    />,
    parent
  );
};

export default TweetOverlay;
