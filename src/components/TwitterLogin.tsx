import axios from "axios";
import React from "react";
import ReactDOM from "react-dom";
import {
  getPageUidByPageTitle,
} from "roam-client";
import Twitter from "../assets/Twitter.svg";
import ExternalLogin, { ExternalLoginOptions } from "./ExternalLogin";

export const twitterLoginOptions = {
  service: "twitter",
  getPopoutUrl: () =>
    axios
      .post(`${process.env.API_URL}/twitter-login`)
      .then(
        (r) =>
          `https://api.twitter.com/oauth/authenticate?oauth_token=${r.data.token}`
      ),
  getAuthData: (data) =>
    axios
      .post(`${process.env.API_URL}/twitter-auth`, JSON.parse(data))
      .then((r) => r.data),
  ServiceIcon: Twitter,
} as ExternalLoginOptions;

const TwitterLogin = ({
  onSuccess,
}: {
  onSuccess: () => void;
}): React.ReactElement => (
  <ExternalLogin
    onSuccess={onSuccess}
    parentUid={getPageUidByPageTitle("roam/js/twitter")}
    {...twitterLoginOptions}
  />
);

export const render = (p: HTMLElement): void =>
  ReactDOM.render(<TwitterLogin onSuccess={() => p.remove()} />, p);

export default TwitterLogin;
