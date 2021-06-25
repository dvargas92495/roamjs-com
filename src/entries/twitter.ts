import { getPageTitle, isTagOnPage, runExtension } from "../entry-helpers";
import {
  addButtonListener,
  addStyle,
  createButtonObserver,
  createHTMLObserver,
  createPageTitleObserver,
  pushBullets,
  getConfigFromPage,
  genericError,
  getParentUidByBlockUid,
  getUidsFromButton,
  getTreeByPageName,
  getUids,
  toRoamDate,
  getPageTitleByPageUid,
  parseRoamDateUid,
  getCurrentPageUid,
} from "roam-client";
import axios from "axios";
import { render } from "../components/TweetOverlay";
import { render as feedRender } from "../components/TwitterFeed";
import { createConfigObserver, getRenderRoot } from "roamjs-components";
import { twitterLoginOptions } from "../components/TwitterLogin";

addStyle(`div.roamjs-twitter-count {
  position: relative;
}

.roamjs-twitter-feed-embed {
  display: inline-block;
  vertical-align: middle;
}`);

const TWITTER_REFERENCES_COMMAND = "twitter references";
const CONFIG = "roam/js/twitter";

const twitterReferencesListener = async (
  _: {
    [key: string]: string;
  },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage(CONFIG);
  const username = config["Username"];
  if (!username) {
    window.roamAlphaAPI.updateBlock({
      block: {
        string: "Error: Missing required parameter username!",
        uid: blockUid,
      },
    });
    return;
  }

  const pageTitle = getPageTitle(document.activeElement).textContent;

  const twitterSearch = axios.get(
    `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/twitter-search?username=${username}&query=${encodeURIComponent(
      pageTitle
    )}`
  );

  twitterSearch
    .then(async (response) => {
      const statuses = response.data.statuses;
      const count = statuses.length;
      if (count === 0) {
        window.roamAlphaAPI.updateBlock({
          block: {
            string: "No tweets found!",
            uid: blockUid,
          },
        });
        return;
      }
      const bullets = statuses.map(
        (i: { id_str: string }) =>
          `https://twitter.com/i/web/status/${i.id_str}`
      );
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

runExtension("twitter", () => {
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
              description: "Click the button to login to Twitter",
              options: twitterLoginOptions,
            },
            {
              title: "sent",
              type: "text",
              description: "Block reference to move sent tweets under.",
            },
            {
              title: "label",
              type: "text",
              description:
                "The label of the block that will be the parent of sent tweets",
            },
            {
              title: "append text",
              type: "text",
              description: "Text to append at the end of a sent tweet block",
            },
            {
              title: "append parent",
              type: "text",
              description:
                "Text to append at the end of the parent block that sent the tweet thread",
            },
          ],
        },
        {
          id: "feed",
          toggleable: true,
          fields: [
            {
              type: "flag",
              title: "any day",
              description:
                "Whether or not the twitter feed should appear any time you appear on a daily note page",
            },
            {
              type: "flag",
              title: "bottom",
              description:
                "Whether to import today's tweets to the top or bottom of the daily note page",
            },
            {
              type: "text",
              title: "format",
              description:
                "The format each tweet will use when imported to the daily note page.",
            },
          ],
        },
      ],
    },
  });

  addButtonListener(TWITTER_REFERENCES_COMMAND, twitterReferencesListener);

  createButtonObserver({
    shortcut: "tweet",
    attribute: "write-tweet",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      render({
        parent: b.parentElement,
        blockUid,
      });
    },
  });

  createHTMLObserver({
    className: "twitter-tweet",
    tag: "DIV",
    callback: (d: HTMLDivElement) => {
      if (!d.hasAttribute("data-roamjs-twitter-reply")) {
        d.setAttribute("data-roamjs-twitter-reply", "true");
        const block = d.closest(".roam-block") as HTMLDivElement;
        const sub = block.getElementsByTagName("sub")[0];
        const tweetMatch = /\/([a-zA-Z0-9_]{1,15})\/status\/([0-9]*)\??/.exec(
          sub?.innerText
        );
        const { blockUid } = getUids(block);
        const span = document.createElement("span");
        d.appendChild(span);
        render({
          parent: span,
          blockUid,
          tweetId: tweetMatch?.[2],
        });
      }
    },
  });

  const feed = getTreeByPageName(CONFIG).find((t) => /feed/i.test(t.text));
  if (feed) {
    const isAnyDay = feed.children.some((t) => /any day/i.test(t.text));
    const format =
      feed.children.find((t) => /format/i.test(t.text))?.children?.[0]?.text ||
      "{link}";
    const callback = ({ title, d }: { d: HTMLDivElement; title: string }) => {
      if (!isTagOnPage({ tag: "Twitter Feed", title })) {
        const parent = document.createElement("div");
        parent.id = "roamjs-twitter-feed";
        d.firstElementChild.insertBefore(
          parent,
          d.firstElementChild.firstElementChild.nextElementSibling
        );
        feedRender(parent, { title, format });
      }
    };
    if (isAnyDay) {
      const listener = (e?: HashChangeEvent) => {
        const d = document.getElementsByClassName(
          "roam-article"
        )[0] as HTMLDivElement;
        if (d) {
          const url = e?.newURL || window.location.href;
          const uid = url.match(/\/page\/(.*)$/)?.[1] || "";
          const attribute = `data-roamjs-${uid}`;
          if (!isNaN(parseRoamDateUid(uid).valueOf())) {
            // React's rerender crushes the old article/heading
            setTimeout(() => {
              if (!d.hasAttribute(attribute)) {
                d.setAttribute(attribute, "true");
                callback({
                  d: document.getElementsByClassName(
                    "roam-article"
                  )[0] as HTMLDivElement,
                  title: getPageTitleByPageUid(uid),
                });
              }
            }, 1);
          } else {
            d.removeAttribute(attribute);
          }
        }
      };
      window.addEventListener("hashchange", listener);
    } else {
      const title = toRoamDate(new Date());
      createPageTitleObserver({
        title,
        log: true,
        callback: (d: HTMLDivElement) => callback({ d, title }),
      });
    }
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Open Twitter Feed",
      callback: () => {
        const title = getPageTitleByPageUid(getCurrentPageUid());
        const root = getRenderRoot("twitter-feed");
        root.id = root.id.replace(/-root$/, "");
        feedRender(root, { format, title });
      },
    });
  }
});
