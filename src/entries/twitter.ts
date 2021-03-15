import {
  addStyle,
  createButtonObserver,
  createHTMLObserver,
  createPageTitleObserver,
  getPageTitle,
  isTagOnPage,
  runExtension,
} from "../entry-helpers";
import {
  addButtonListener,
  pushBullets,
  getConfigFromPage,
  genericError,
  getParentUidByBlockUid,
  getUidsFromButton,
  getTreeByPageName,
  getUids,
  toRoamDate,
} from "roam-client";
import axios from "axios";
import { render } from "../components/TweetOverlay";
import { render as loginRender } from "../components/TwitterLogin";
import { render as feedRender } from "../components/TwitterFeed";

addStyle(`.roamjs-twitter-count {
  position: relative;
}

.roamjs-twitter-feed-embed {
  display: inline-block;
  vertical-align: middle;
}`);

const TWITTER_REFERENCES_COMMAND = "twitter references";

const twitterReferencesListener = async (
  _: {
    [key: string]: string;
  },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/twitter");
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
    tag: "H1",
    className: "rm-title-display",
    callback: (title: HTMLHeadingElement) => {
      const d = title.closest(".roam-article");
      if (title.innerText === "roam/js/twitter" && d) {
        if (!d.hasAttribute("data-roamjs-twitter-login")) {
          const tree = getTreeByPageName("roam/js/twitter");
          const oauthNode = tree.find((t) => /oauth/i.test(t.text.trim()));
          if (!oauthNode) {
            const span = document.createElement("span");
            span.id = "roamjs-twitter-login";
            d.insertBefore(span, d.firstElementChild);
            loginRender(span);
          }
        } else {
          const span = document.getElementById("roamjs-twitter-login");
          if (span) {
            span.remove();
          }
        }
      }
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

  const feed = getTreeByPageName("roam/js/twitter").find((t) =>
    /feed/i.test(t.text)
  );
  if (feed) {
    const title = toRoamDate(new Date());
    createPageTitleObserver({
      title,
      log: true,
      callback: (d: HTMLDivElement) => {
        if (!isTagOnPage({ tag: "Twitter Feed", title })) {
          const parent = document.createElement("div");
          parent.id = "roamjs-twitter-feed";
          d.firstElementChild.insertBefore(
            parent,
            d.firstElementChild.firstElementChild.nextElementSibling
          );
          feedRender(parent);
        }
      },
    });
  }
});
