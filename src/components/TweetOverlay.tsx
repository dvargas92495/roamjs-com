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
  getEditTimeByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  generateBlockUid,
  getUids,
} from "roam-client";
import { getSettingValueFromTree } from "./hooks";
import axios from "axios";
import twitter from "twitter-text";

const ATTACHMENT_REGEX = /!\[[^\]]*\]\(([^\s)]*)\)/g;
const UPLOAD_URL = `${process.env.REST_API_URL}/twitter-upload`;
const TWITTER_MAX_SIZE = 5000000;

const toCategory = (mime: string) => {
  if (mime.startsWith('video')) {
    return 'tweet_image';
  } else if (mime.endsWith('gif')) {
    return 'tweet_gif';
  } else {
    return 'tweet_image';
  }
}

const uploadAttachments = async ({
  attachmentUrls,
  key,
  secret,
}: {
  attachmentUrls: string[];
  key: string;
  secret: string;
}): Promise<string[]> => {
  if (!attachmentUrls.length) {
    return Promise.resolve([]);
  }
  const mediaIds = [];
  for (const attachmentUrl of attachmentUrls) {
    const attachment = await axios
      .get(attachmentUrl, { responseType: "blob" })
      .then((r) => r.data as Blob);
    const media_id = await axios
      .post(UPLOAD_URL, {
        key,
        secret,
        params: {
          command: "INIT",
          total_bytes: attachment.size,
          media_type: attachment.type,
          media_category: toCategory(attachment.type),
        },
      })
      .then((r) => r.data.media_id_string);
    const reader = new FileReader();
    const data = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(attachment);
    });
    for (let i = 0; i < data.length; i += TWITTER_MAX_SIZE) {
      await axios.post(UPLOAD_URL, {
        key,
        secret,
        params: {
          command: "APPEND",
          media_id,
          media_data: data.slice(i, i + TWITTER_MAX_SIZE),
          segment_index: i / TWITTER_MAX_SIZE,
        },
      });
    }
    await axios.post(UPLOAD_URL, {
      key,
      secret,
      params: { command: "FINALIZE", media_id },
    });
    mediaIds.push(media_id);
  }
  return mediaIds;
};

const TwitterContent: React.FunctionComponent<{
  blockUid: string;
  tweetId?: string;
  tweetUsername?: string;
  close: () => void;
}> = ({ close, blockUid, tweetId, tweetUsername }) => {
  const message = useMemo(() => getTreeByBlockUid(blockUid).children, [
    blockUid,
  ]);
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
    const sentLabel = getSettingValueFromTree({
      tree,
      key: "label",
      defaultValue: "Sent at {now}",
    });
    const appendText = getSettingValueFromTree({
      tree,
      key: "append text",
    });
    const sentBlockIsValid =
      sentBlockUid && !!getEditTimeByBlockUid(sentBlockUid);
    const sourceUid = generateBlockUid();
    if (sentBlockIsValid) {
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": sentBlockUid, order: 0 },
        block: {
          string: sentLabel.replace("{now}", new Date().toLocaleString()),
          uid: sourceUid,
        },
      });
    }
    let in_reply_to_status_id = tweetId;
    let success = true;
    for (let index = 0; index < message.length; index++) {
      setTweetsSent(index + 1);
      const { text, uid } = message[index];
      const attachmentUrls: string[] = [];
      const content = text.replace(ATTACHMENT_REGEX, (_, url) => {
        attachmentUrls.push(url);
        return "";
      });
      const media_ids = await uploadAttachments({
        attachmentUrls,
        key,
        secret,
      }).catch((e) => {
        console.error(e.response?.data || e.message);
        return [];
      });
      if (media_ids.length < attachmentUrls.length) {
        setTweetsSent(0);
        setError("Some attachments failed to upload");
        return "";
      }
      success = await axios
        .post(`${process.env.REST_API_URL}/twitter-tweet`, {
          key,
          secret,
          content,
          in_reply_to_status_id,
          auto_populate_reply_metadata: !!in_reply_to_status_id,
          media_ids,
        })
        .then((r) => {
          const {
            id_str,
            user: { screen_name },
          } = r.data;
          in_reply_to_status_id = id_str;
          if (appendText) {
            const link = `https://twitter.com/${screen_name}/status/${id_str}`;
            window.roamAlphaAPI.updateBlock({
              block: {
                uid,
                string: `${text} ${appendText.replace("{link}", link)}`,
              },
            });
          }
          if (sentBlockIsValid) {
            window.roamAlphaAPI.moveBlock({
              location: { "parent-uid": sourceUid, order: index },
              block: { uid },
            });
          }
          return true;
        })
        .catch((e) => {
          if (sentBlockIsValid && index === 0) {
            window.roamAlphaAPI.deleteBlock({ block: { uid: sourceUid } });
          }
          setError(
            e.response?.data?.errors
              ? e.response?.data?.errors
                  .map(({ code }: { code: number }) => {
                    switch (code) {
                      case 220:
                        return "Invalid credentials. Try logging in through the roam/js/twitter page";
                      case 186:
                        return "Tweet is too long. Make it shorter!";
                      case 170:
                        return "Tweet failed to send because it was empty.";
                      case 187:
                        return "Tweet failed to send because Twitter detected it was a duplicate.";
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
  }, [setTweetsSent, close, setError, tweetId, tweetUsername]);
  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      <Button text={tweetId ? "Send Reply" : "Send Tweet"} onClick={onClick} />
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
  tweetId?: string;
  tweetUsername?: string;
  childrenRef: HTMLDivElement;
  unmount: () => void;
}> = ({ childrenRef, blockUid, unmount, tweetId, tweetUsername }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const calcCounts = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => {
        const { weightedLength, valid } = twitter.parseTweet(
          t.text.replace(ATTACHMENT_REGEX, "")
        );
        return {
          count: weightedLength,
          valid,
          uid: t.uid,
        };
      }),
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
  const valid = useMemo(() => counts.every(({ valid }) => valid), [counts]);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const inputCallback = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const { blockUid: currentUid } = getUids(textarea);
        blocks.current = calcBlocks();
        setCounts(
          calcCounts().map((c) => {
            if (c.uid === currentUid) {
              const { weightedLength, valid } = twitter.parseTweet(
                textarea.value.replace(ATTACHMENT_REGEX, "")
              );
              return { uid: currentUid, count: weightedLength, valid };
            } else {
              return c;
            }
          })
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
    if (rootRef.current && !document.contains(rootRef.current.targetElement)) {
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
          />
        }
        content={
          <TwitterContent
            blockUid={blockUid}
            tweetId={tweetId}
            close={close}
            tweetUsername={tweetUsername}
          />
        }
        isOpen={isOpen}
        onInteraction={(next) => setIsOpen(next && valid)}
        ref={rootRef}
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
  tweetId,
  tweetUsername,
}: {
  parent: HTMLSpanElement;
  blockUid: string;
  tweetId?: string;
  tweetUsername?: string;
}): void => {
  const childrenRef = parent.closest(".rm-block-main")
    ?.nextElementSibling as HTMLDivElement;
  Array.from(
    childrenRef.getElementsByClassName("roamjs-twitter-count")
  ).forEach((s) => s.remove());
  ReactDOM.render(
    <TweetOverlay
      blockUid={blockUid}
      tweetId={tweetId}
      tweetUsername={tweetUsername}
      childrenRef={childrenRef}
      unmount={() => ReactDOM.unmountComponentAtNode(parent)}
    />,
    parent
  );
};

export default TweetOverlay;
