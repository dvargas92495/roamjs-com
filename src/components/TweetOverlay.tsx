import {
  Button,
  Icon,
  Popover,
  Portal,
  Spinner,
  Text,
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  generateBlockUid,
  getUids,
  getParentUidByBlockUid,
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
          string: `Sent at ${new Date().toISOString()}`,
          uid: sourceUid,
        },
      });
    }
    let inReplyToStatusId = 0;
    let name = "";
    let success = true;
    for (let index = 0; index < message.length; index++) {
      setTweetsSent(index + 1);
      const { content, uid } = message[index];
      success = await axios
        .post(`${API_URL}/twitter-tweet`, {
          key,
          secret,
          content: `${inReplyToStatusId ? `@${name} ` : ""}${content}${
            inReplyToStatusId
              ? `&in_reply_to_status_id=${inReplyToStatusId}`
              : ""
          }`,
        })
        .then((r) => {
          const {
            id,
            user: { screen_name },
          } = r.data;
          inReplyToStatusId = id;
          name = screen_name;
          if (sentBlockUid) {
            window.roamAlphaAPI.moveBlock({
              location: { "parent-uid": sourceUid, order: 0 },
              block: { uid },
            });
          }
          return true;
        })
        .catch((e) => {
          setError(e.message);
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
    <div style={{ padding: 16 }}>
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
}> = ({ childrenRef, blockUid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const calcCounts = useCallback(
    () => getTreeByBlockUid(blockUid).children.map((t) => t.text.length),
    [blockUid]
  );
  const [counts, setCounts] = useState(calcCounts);
  const inputCallback = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const { blockUid: currentUid } = getUids(target as HTMLTextAreaElement);
        const parentUid = getParentUidByBlockUid(currentUid);
        if (parentUid === blockUid) {
          setCounts(calcCounts());
        }
      }
    },
    [blockUid, setCounts, calcCounts]
  );
  useEffect(() => {
    childrenRef.addEventListener("input", inputCallback);
    return () => childrenRef.removeEventListener("input", inputCallback);
  }, [childrenRef, inputCallback]);
  return (
    <>
      <Popover
        target={
          <Icon
            icon={
              <Twitter
                style={{ width: 15, marginLeft: 4, cursor: "pointer" }}
              />
            }
            onClick={open}
          />
        }
        content={<TwitterContent blockUid={blockUid} close={close} />}
        isOpen={isOpen}
        onInteraction={setIsOpen}
      />
      {counts.map((count, i) => (
        <Portal container={childrenRef.children[i] as HTMLElement}>
          {count}/280
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
}): void =>
  ReactDOM.render(
    <TweetOverlay
      blockUid={blockUid}
      childrenRef={
        parent.closest(".rm-block-main")?.nextElementSibling as HTMLDivElement
      }
    />,
    parent
  );

export default TweetOverlay;
