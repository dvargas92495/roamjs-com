import { createHashtagObserver, getTreeByPageName, getUids } from "roam-client";
import { runExtension } from "../entry-helpers";
import {
  getAliases,
  getChannelFormat,
  getUserFormat,
  render,
} from "../components/SlackOverlay";
import { createConfigObserver } from "roamjs-components";
import Slack from "../assets/Slack_Mark.svg";
import axios from "axios";

const CONFIG = "roam/js/slack";

runExtension("slack", () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              title: "oauth",
              type: "oauth",
              description: "Click the button below to login with slack",
              options: {
                ServiceIcon: Slack,
                service: "slack",
                getPopoutUrl: () =>
                  Promise.resolve(
                    `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=channels:read,chat:write,users:read,users:read.email&user_scope=chat:write&redirect_uri=https://roamjs.com/oauth?auth=true`
                  ),
                getAuthData: (d) =>
                  axios
                    .post(`${process.env.REST_API_URL}/slack-url`, {
                      ...JSON.parse(d),
                      redirect_uri: "https://roamjs.com/oauth?auth=true",
                    })
                    .then((r) => r.data),
              },
            },
          ],
        },
      ],
    },
  });
  createHashtagObserver({
    attribute: "data-roamjs-slack-overlay",
    callback: (s: HTMLSpanElement) => {
      const tree = getTreeByPageName(CONFIG);
      const userFormatIsDefault = tree.every(
        (t) => !/user format/i.test(t.text.trim())
      );
      const channelFormatIsDefault = tree.every(
        (t) => !/channel format/i.test(t.text.trim())
      );
      const userFormatRegex = new RegExp(
        getUserFormat(tree).replace(/{real name}|{username}/, "(.*)"),
        "i"
      );
      const channelFormatRegex = new RegExp(
        getChannelFormat(tree).replace(/{channel}/, "(.*)"),
        "i"
      );
      const aliasKeys = new Set(Object.keys(getAliases(tree)));
      const r = s.getAttribute("data-tag");
      if (
        aliasKeys.size
          ? aliasKeys.has(r) ||
            (!userFormatIsDefault && userFormatRegex.test(r)) ||
            (!channelFormatIsDefault && channelFormatRegex.test(r))
          : userFormatRegex.test(r) || channelFormatRegex.test(r)
      ) {
        const container = s.closest(".roam-block") as HTMLDivElement;
        if (container) {
          const { blockUid } = getUids(container);
          const newSpan = document.createElement("span");
          newSpan.style.verticalAlign = "middle";
          newSpan.onmousedown = (e: MouseEvent) => e.stopPropagation();
          s.appendChild(newSpan);
          render({
            parent: newSpan,
            tag: r,
            blockUid,
          });
        }
      }
    },
  });
});
