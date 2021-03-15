import { Button, Checkbox, Dialog, Intent, Spinner } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getTreeByPageName,
  toRoamDate,
  toRoamDateUid,
} from "roam-client";
import { getSettingValueFromTree } from "./hooks";
import subDays from "date-fns/subDays";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import TweetEmbed from "react-tweet-embed";

type Tweet = {
  id: string;
  checked: boolean;
};

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

const TwitterFeed = (): React.ReactElement => {
  const date = useMemo(() => new Date(), []);
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
        setTweets(
          r.data.tweets.map((t) => ({ ...t, checked: true, loaded: false }))
        );
      })
      .catch((r) => setError(r.response?.data || r.message))
      .finally(() => setLoading(false));
  }, [setTweets, yesterday]);
  const onClick = useCallback(() => {
    createBlock({
      parentUid: toRoamDateUid(date),
      order: 0,
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
  }, [tweets, onClose]);
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
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
              style={{ maxHeight: 760, overflowY: "scroll", paddingBottom: 16 }}
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
                              checked: (e.target as HTMLInputElement).checked,
                              ...t,
                            }
                          : t
                      )
                    )
                  }
                >
                  <TweetLabel id={tweet.id} />
                </Checkbox>
              ))}
              {!tweets.length && <span>No tweets liked yesterday</span>}
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

export const render = (parent: HTMLDivElement): void =>
  ReactDOM.render(<TwitterFeed />, parent);

export default TwitterFeed;
