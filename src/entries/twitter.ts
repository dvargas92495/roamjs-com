import { getPageTitle, runExtension } from "../entry-helpers";
import {
  addButtonListener,
  pushBullets,
  getConfigFromPage,
  genericError,
  updateActiveBlock,
} from "roam-client";
import axios from "axios";

const TWITTER_REFERENCES_COMMAND = "twitter references";

const twitterReferencesListener = async (
  _: {
    [key: string]: string;
  },
  blockUid: string,
  parentUid: string
) => {
  const config = getConfigFromPage("roam/js/twitter");
  const username = config["Username"];
  if (!username) {
    updateActiveBlock("Error: Missing required parameter username!");
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
        updateActiveBlock("No tweets found!");
        return;
      }
      const bullets = statuses.map(
        (i: {id_str: string}) => `https://twitter.com/i/web/status/${i.id_str}`
      );
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

runExtension("twitter", () => {
  addButtonListener(TWITTER_REFERENCES_COMMAND, twitterReferencesListener);
});
