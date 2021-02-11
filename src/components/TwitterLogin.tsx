import { Button, Icon, Spinner, Text } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { generateBlockUid } from "roam-client";
import Twitter from "../assets/Twitter.svg";
import { getPageUidByPageTitle } from "../entry-helpers";
import { API_URL } from "./hooks";

const TwitterLogin: React.FunctionComponent<{ onSuccess: () => void }> = ({
  onSuccess,
}) => {
  const pageUid = useMemo(() => getPageUidByPageTitle("roam/js/twitter"), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onClick = useCallback(() => {
    setLoading(true);
    axios
      .post(`${API_URL}/twitter-login`)
      .then((r) => {
        const width = 400;
        const height = 600;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        const loginWindow = window.open(
          `https://api.twitter.com/oauth/authenticate?oauth_token=${r.data.token}`,
          "roamjs:twitter:login",
          `left=${left},top=${top},width=${width},height=${height},status=1`
        );
        const messageEventListener = (e: MessageEvent) => {
          if (e.origin === "https://roamjs.com") {
            loginWindow.close();
            axios
              .post(`${API_URL}/twitter-auth`, JSON.parse(e.data))
              .then((rr) => {
                const blockUid = generateBlockUid();
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": pageUid, order: 0 },
                  block: { open: false, string: "oauth", uid: blockUid },
                });
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": blockUid, order: 0 },
                  block: { string: JSON.stringify(rr.data) },
                });
                window.removeEventListener("message", messageEventListener);
                onSuccess();
              });
          }
        };
        window.addEventListener("message", messageEventListener);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [onSuccess, pageUid, setLoading, setError]);
  return (
    <>
      <Button
        icon={
          <Icon
            icon={
              <Twitter
                style={{ width: 15, marginLeft: 4, cursor: "pointer" }}
              />
            }
          />
        }
        onClick={onClick}
        disabled={loading}
      >
        Login With Twitter
      </Button>
      {loading && <Spinner size={Spinner.SIZE_SMALL} />}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          <Text>{error}</Text>
        </div>
      )}
    </>
  );
};

export const render = (p: HTMLElement): void =>
  ReactDOM.render(<TwitterLogin onSuccess={() => p.remove()} />, p);

export default TwitterLogin;
