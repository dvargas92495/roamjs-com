import {
  Alert,
  Button,
  Icon,
  Popover,
  Portal,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
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
  getUids,
} from "roam-client";
import { getSettingValueFromTree, useSocialToken } from "./hooks";
import axios from "axios";
import twitter from "twitter-text";
import addYears from "date-fns/addYears";
import endOfYear from "date-fns/endOfYear";
import format from "date-fns/format";
import { resolveRefs } from "../entry-helpers";

const ATTACHMENT_REGEX = /!\[[^\]]*\]\(([^\s)]*)\)/g;
const UPLOAD_URL = `${process.env.REST_API_URL}/twitter-upload`;
const TWITTER_MAX_SIZE = 5000000;

const toCategory = (mime: string) => {
  if (mime.startsWith("video")) {
    return "tweet_video";
  } else if (mime.endsWith("gif")) {
    return "tweet_gif";
  } else {
    return "tweet_image";
  }
};

const Error: React.FunctionComponent<{ error: string }> = ({ error }) =>
  error ? (
    <div style={{ color: "red", whiteSpace: "pre-line" }}>
      <Text>{error}</Text>
    </div>
  ) : (
    <></>
  );

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
    const media_category = toCategory(attachment.type);
    const { media_id, error } = await axios
      .post(UPLOAD_URL, {
        key,
        secret,
        params: {
          command: "INIT",
          total_bytes: attachment.size,
          media_type: attachment.type,
          media_category,
        },
      })
      .then((r) => ({ media_id: r.data.media_id_string, error: "" }))
      .catch((e) => ({ error: e.response.data.error, media_id: "" }));
    if (error) {
      return Promise.reject({ roamjsError: error });
    }
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

    if (media_category !== "tweet_image") {
      await new Promise<void>((resolve, reject) => {
        const getStatus = () =>
          axios
            .post(UPLOAD_URL, {
              key,
              secret,
              params: { command: "STATUS", media_id },
            })
            .then((r) => r.data.processing_info)
            .then(({ state, check_after_secs, error }) => {
              if (state === "succeeded") {
                resolve();
              } else if (state === "failed") {
                reject(error.message);
              } else {
                setTimeout(getStatus, check_after_secs * 1000);
              }
            });
        return getStatus();
      });
    }

    mediaIds.push(media_id);
  }
  return mediaIds;
};

const TwitterContent: React.FunctionComponent<{
  blockUid: string;
  tweetId?: string;
  close: () => void;
  setDialogMessage: (m: string) => void;
}> = ({ close, blockUid, tweetId, setDialogMessage }) => {
  const message = useMemo(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => ({
        ...t,
        text: resolveRefs(t.text),
      })),
    [blockUid]
  );
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
    const sourceUid = window.roamAlphaAPI.util.generateUID();
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
        console.error(e.response?.data || e.message || e);
        setTweetsSent(0);
        if (e.roamjsError) {
          setError(e.roamjsError);
        } else {
          setError(
            "Some attachments failed to upload. Email support@roamjs.com for help!"
          );
        }
        return [];
      });
      if (media_ids.length < attachmentUrls.length) {
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
  }, [setTweetsSent, close, setError, tweetId]);

  const socialToken = useSocialToken();
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const openSchedule = useCallback(() => setShowSchedule(true), [
    setShowSchedule,
  ]);
  const closeSchedule = useCallback(() => setShowSchedule(false), [
    setShowSchedule,
  ]);
  const onScheduleClick = useCallback(() => {
    setLoading(true);
    axios
      .post(
        `${process.env.REST_API_URL}/twitter-schedule`,
        {
          scheduleDate: scheduleDate.toJSON(),
          payload: JSON.stringify({ blocks: message, tweetId }),
          oauth: getSettingValueFromTree({
            tree: getTreeByPageName("roam/js/twitter"),
            key: "oauth",
            defaultValue: "{}",
          }),
        },
        { headers: { Authorization: `social:${socialToken}` } }
      )
      .then(() => {
        setLoading(false);
        setDialogMessage(
          `Tweet Successfully Scheduled to post at ${format(
            scheduleDate,
            "yyyy/MM/dd hh:mm:ss a"
          )}!`
        );
      })
      .catch((e) => {
        setError(e.response?.data);
        setLoading(false);
        return false;
      })
      .then((success: boolean) => success && close());
  }, [
    setError,
    close,
    setLoading,
    scheduleDate,
    socialToken,
    setDialogMessage,
    message,
    tweetId,
  ]);
  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      {showSchedule ? (
        <>
          <Button icon="arrow-left" minimal onClick={closeSchedule} />
          <div>
            <DatePicker
              value={scheduleDate}
              onChange={setScheduleDate}
              maxDate={addYears(endOfYear(new Date()), 5)}
              timePrecision={"minute"}
              highlightCurrentDay
              timePickerProps={{ useAmPm: true, showArrowButtons: true }}
            />
            <Button
              text={"Schedule"}
              onClick={onScheduleClick}
              id={"roamjs-send-schedule-button"}
            />
            {loading && <Spinner size={Spinner.SIZE_SMALL} />}
            <Error error={error} />
          </div>
        </>
      ) : (
        <>
          <Button
            text={tweetId ? "Send Reply" : "Send Tweet"}
            onClick={onClick}
          />
          {tweetsSent > 0 && (
            <div>
              Sending {tweetsSent} of {message.length} tweets.{" "}
              <Spinner size={Spinner.SIZE_SMALL} />
            </div>
          )}
          <Error error={error} />
          {!!socialToken && (
            <div style={{ marginTop: 16 }}>
              <Button
                text={tweetId ? "Schedule Reply" : "Schedule Tweet"}
                onClick={openSchedule}
                id={"roamjs-schedule-tweet-button"}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TweetOverlay: React.FunctionComponent<{
  blockUid: string;
  tweetId?: string;
  childrenRef?: HTMLDivElement;
  unmount: () => void;
}> = ({ childrenRef, blockUid, unmount, tweetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const rootRef = useRef(null);
  const calcCounts = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => {
        const { weightedLength, valid } = twitter.parseTweet(
          resolveRefs(t.text.replace(ATTACHMENT_REGEX, ""))
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
      Array.from(childrenRef?.children || [])
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
  const closeDialog = useCallback(() => setDialogMessage(""), [
    setDialogMessage,
  ]);
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
                resolveRefs(textarea.value.replace(ATTACHMENT_REGEX, ""))
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
    if (childrenRef) {
      childrenRef.addEventListener("input", inputCallback);
      return () => childrenRef.removeEventListener("input", inputCallback);
    }
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
            setDialogMessage={setDialogMessage}
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
      <Alert
        isOpen={!!dialogMessage}
        onClose={closeDialog}
        canEscapeKeyCancel
        canOutsideClickCancel
      >
        <p>{dialogMessage}</p>
        <p>
          Visit the <span className="rm-page-ref__brackets">[[</span>
          <span tabIndex={-1} className="rm-page-ref rm-page-ref--link">
            roam/js/social
          </span>
          <span className="rm-page-ref__brackets">]]</span> page to track the
          tweet's status.
        </p>
      </Alert>
    </>
  );
};

export const render = ({
  parent,
  blockUid,
  tweetId,
}: {
  parent: HTMLSpanElement;
  blockUid: string;
  tweetId?: string;
}): void => {
  const childrenRef = parent.closest(".rm-block-main")
    ?.nextElementSibling as HTMLDivElement;
  if (childrenRef) {
    Array.from(
      childrenRef.getElementsByClassName("roamjs-twitter-count")
    ).forEach((s) => s.remove());
  }
  ReactDOM.render(
    <TweetOverlay
      blockUid={blockUid}
      tweetId={tweetId}
      childrenRef={childrenRef}
      unmount={() => ReactDOM.unmountComponentAtNode(parent)}
    />,
    parent
  );
};

export default TweetOverlay;
