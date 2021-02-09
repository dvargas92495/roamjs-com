import {
  createButtonObserver,
  createHTMLObserver,
  getPageTitle,
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
} from "roam-client";
import axios from "axios";
import { render } from "../components/TweetOverlay";
import { render as loginRender } from "../components/TwitterLogin";

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
      render({ parent: b.parentElement, blockUid });
    },
  });

  createHTMLObserver({
    tag: 'h1',
    className: 'rm-title-display',
    callback: (h1: HTMLHeadingElement) => {
      const title = getPageTitle(h1).textContent;
      if (title === 'roam/js/twitter') {
        if (!h1.hasAttribute('data-roamjs-twitter-login')) {
          const tree = getTreeByPageName('roam/js/twitter');
          const oauthNode = tree.find((t) => /oauth/i.test(t.text.trim()));
          if (!oauthNode) {
            const span = document.createElement('span');
            h1.appendChild(span);
            loginRender(span);
          }
        }
      }
    }
  })
});
