import { getPageTitle, runExtension } from "../entry-helpers";
import {
  addButtonListener,
  asyncType,
  pushBullets,
  getConfigFromPage,
  genericError,
} from "roam-client";
import axios from "axios";

const TWITTER_REFERENCES_COMMAND = "twitter references";

const twitterReferencesListener = async (
  _: any,
  blockUid: string,
  parentUid: string
) => {
  const config = getConfigFromPage("roam/js/twitter");
  const username = config["Username"];
  if (!username) {
    await asyncType("Error: Missing required parameter username!");
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
      let statuses = response.data.statuses;
      let count = statuses.length;
      if (count === 0) {
        await asyncType("No tweets found!");
        return;
      }
      const bullets = statuses.map(
        (i: any) => `https://twitter.com/i/web/status/${i.id_str}`
      );
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

runExtension({
  extensionId: "twitter",
  run: () => {
    addButtonListener(TWITTER_REFERENCES_COMMAND, twitterReferencesListener);
  },
});
