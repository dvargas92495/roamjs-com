import { Button, Icon } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import { getPageUidByPageTitle } from "../entry-helpers";
import { API_URL } from "./hooks";

const TwitterLogin: React.FunctionComponent = () => {
  const pageUid = useMemo(() => getPageUidByPageTitle("roam/js/twitter"), []);
  const windowRef = useRef<Window>();
  const onClick = useCallback(
    () =>
      axios.post(`${API_URL}/twitter-login`).then((r) => {
        const width = 400;
        const height = 600;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        const loginWindow = window.open(
          `https://api.twitter.com/oauth/authenticate?oauth_token=${r.data.token}`,
          "roamjs:twitter:login",
          `left=${left},top=${top},width=${width},height=${height},status=1`
        );
        loginWindow.addEventListener("message", (e) => {
          loginWindow.close();
          axios
            .post(`${API_URL}/twitter-auth`, JSON.parse(e.data))
            .then((rr) => {
              const blockUid = "RjsTwrTok";
              window.roamAlphaAPI.createBlock({
                location: { "parent-uid": pageUid, order: 0 },
                block: { string: "oauth", uid: blockUid },
              });
              window.roamAlphaAPI.createBlock({
                location: { "parent-uid": blockUid, order: 0 },
                block: { string: JSON.stringify(rr.data) },
              });
            });
        });
      }),
    [windowRef]
  );
  return (
    <Button
      icon={
        <Icon
          icon={
            <Twitter style={{ width: 15, marginLeft: 4, cursor: "pointer" }} />
          }
        />
      }
      onClick={onClick}
    >
      Login With Twitter
    </Button>
  );
};

export const render = (p: HTMLElement): void =>
  ReactDOM.render(<TwitterLogin />, p);

export default TwitterLogin;
