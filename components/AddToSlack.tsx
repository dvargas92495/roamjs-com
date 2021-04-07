import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "./constants";
import { Body } from "@dvargas92495/ui";

const AddToSlack: React.FunctionComponent = () => {
  const [token, setToken] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("code")) {
      axios
        .post(`${API_URL}/slack-url`, { code: query.get("code") })
        .then((r) => setToken(r.data.token));
    }
  }, [setToken]);
  return token ? (
    <div>
      <Body>
        Copy this token into your <code>roam/js/slack</code> page.
      </Body>
      <pre style={{ backgroundColor: "white" }}>{token}</pre>
      <Body>
        You will need to set the token as a child of a block that says{" "}
        <code>token</code>, like below
      </Body>
      <ul>
        <li>
          token
          <ul>
            <li>{token}</li>
          </ul>
        </li>
      </ul>
    </div>
  ) : (
    <div>
      <Body>
        Add the RoamJS app to your workspace by clicking the button below. After
        confirming, you will be redirected to this page where you will find your
        Slack workspace's token.
      </Body>
      <a
        href={`https://slack.com/oauth/v2/authorize?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}&scope=channels:read,chat:write,users:read,users:read.email&user_scope=chat:write`}
      >
        <img
          alt="Add to Slack"
          height="40"
          width="139"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>
    </div>
  );
};

export default AddToSlack;
