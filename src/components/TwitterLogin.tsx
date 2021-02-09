import { Button, Icon } from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import { getPageUidByPageTitle } from "../entry-helpers";

const API_URL =
  "https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production";

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
        loginWindow.addEventListener("popstate", () => {
          const query = new URLSearchParams(loginWindow.location.search);
          const isAuth = query.get("auth");
          if (isAuth) {
            const oauth_token = query.get("oauth_token");
            const oauth_verifier = query.get("oauth_verifier");
            if (oauth_token && oauth_verifier) {
              return axios
                .post(`${API_URL}/twitter-auth`, {
                  oauth_token,
                  oauth_verifier,
                })
                .then((rr) =>
                  window.roamAlphaAPI.createBlock({
                    location: { "parent-uid": pageUid, order: 0 },
                    block: { string: JSON.stringify(rr.data) },
                  })
                )
                .then(() => loginWindow.close());
            }
          }
        });
        loginWindow.addEventListener('message', console.log)
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
