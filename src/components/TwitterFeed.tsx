import { Button, Checkbox, Dialog, Intent, Spinner } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getTreeByPageName,
  parseRoamDate,
  toRoamDate,
  toRoamDateUid,
} from "roam-client";
import { getSettingValueFromTree } from "./hooks";
import subDays from "date-fns/subDays";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import TweetEmbed from "react-tweet-embed";
import { getChildrenLengthByPageTitle } from "../entry-helpers";

type Tweet = {
  id: string;
  checked: boolean;
};

const getOrder = (title: string) => {
  const tree = getTreeByPageName("roam/js/twitter");
  const isBottom = tree
    .find((t) => /feed/i.test(t.text))
    ?.children?.some?.((t) => /bottom/i.test(t.text));
  return isBottom ? getChildrenLengthByPageTitle(title) : 0
}

const TweetLabel = ({ id }: { id: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Spinner size={Spinner.SIZE_SMALL} />}
      <TweetEmbed
        id={id}
        options={{
          cards: "hidden",
          width: 280,
          conversation: "none",
        }}
        className={"roamjs-twitter-feed-embed"}
        onTweetLoadSuccess={() => setLoaded(true)}
      />
    </>
  );
};

const TwitterFeed = ({ title }: { title: string }): React.ReactElement => {
  const date = useMemo(() => parseRoamDate(title), [title]);
  const yesterday = useMemo(() => subDays(date, 1), [date]);
  const roamDate = useMemo(() => toRoamDate(yesterday), [yesterday]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const onClose = useCallback(() => {
    ReactDOM.unmountComponentAtNode(
      document.getElementById("roamjs-twitter-feed")
    );
  }, [tweets]);
  const onCancel = useCallback(() => {
    createBlock({
      parentUid: toRoamDateUid(date),
      order: getOrder(title),
      node: {
        text: "#[[Twitter Feed]]",
        children: [
          {
            text: "Cancelled",
            children: [],
          },
        ],
      },
    });
    onClose();
  }, [onClose, date, title]);
  useEffect(() => {
    const tree = getTreeByPageName("roam/js/twitter");
    const oauth = getSettingValueFromTree({
      tree,
      key: "oauth",
      defaultValue: "{}",
    });
    if (oauth === "{}") {
      setError(
        "Need to log in with Twitter to use Daily Twitter Feed! Head to roam/js/twitter page to log in."
      );
      return;
    }
    const { oauth_token: key, oauth_token_secret: secret } = JSON.parse(oauth);
    axios
      .get<{ tweets: { id: string }[] }>(
        `${process.env.REST_API_URL}/twitter-feed?from=${startOfDay(
          yesterday
        ).toJSON()}&to=${endOfDay(yesterday).toJSON()}`,
        {
          headers: {
            Authorization: `${key}:${secret}`,
          },
        }
      )
      .then((r) => {
        setTweets(r.data.tweets.map((t) => ({ ...t, checked: true })));
      })
      .catch((r) => setError(r.response?.data || r.message))
      .finally(() => setLoading(false));
  }, [setTweets, yesterday]);
  const onClick = useCallback(() => {
    createBlock({
      parentUid: toRoamDateUid(date),
      order: getOrder(title),
      node: {
        text: "#[[Twitter Feed]]",
        children: tweets
          .filter(({ checked }) => checked)
          .map((t) => ({
            text: `https://twitter.com/i/web/status/${t.id}`,
            children: [],
          })),
      },
    });
    onClose();
  }, [tweets, onClose, title, date]);
  return (
    <Dialog
      isOpen={true}
      onClose={onCancel}
      canOutsideClickClose
      canEscapeKeyClose
      title={`Twitter Feed for ${roamDate}`}
    >
      <div style={{ padding: 16 }}>
        {loading ? (
          <Spinner />
        ) : error ? (
          <span style={{ color: "darkred" }}>{error}</span>
        ) : (
          <>
            <div
              style={{
                maxHeight: 760,
                overflowY: "scroll",
                paddingBottom: 16,
                paddingLeft: 4,
              }}
            >
              {tweets.map((tweet) => (
                <Checkbox
                  key={tweet.id}
                  checked={tweet.checked}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setTweets(
                      tweets.map((t) =>
                        t.id === tweet.id
                          ? {
                              ...t,
                              checked: (e.target as HTMLInputElement).checked,
                            }
                          : t
                      )
                    )
                  }
                >
                  <TweetLabel id={tweet.id} />
                </Checkbox>
              ))}
              {!tweets.length && <span>No tweets liked.</span>}
            </div>
            <Button
              onClick={onClick}
              intent={Intent.PRIMARY}
              style={{ marginTop: 16 }}
            >
              {tweets.length ? "IMPORT" : "OK"}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
};

export const render = (parent: HTMLDivElement, title: string): void =>
  ReactDOM.render(<TwitterFeed title={title} />, parent);

export default TwitterFeed;
