import {
  addButtonListener,
  asyncType,
  pushBullets,
  getConfigFromPage,
} from "../entry-helpers";

const TWITTER_REFERENCES_COMMAND = "twitter references";

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}

const twitterReferencesListener = async () => {
	const config = getConfigFromPage("twitter");
	const username = config["Username"];
	if (!username) {
		await asyncType("Error: Missing required parameter username!");
		return;
	}

	const pageTitle = document.getElementsByClassName("rm-title-display")[0].textContent;

	const twitterSearch = fetch(
	    `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/twitter-search?username=${username}&query=${pageTitle}`
	);

	twitterSearch
	.then((r) => {
	  if (!r.ok) {
	    return r
	      .text()
	      .then((errorMessage) =>
	        asyncType(`Error searching Twitter: ${errorMessage}`)
	      );
	  }
	  return r.json().then(async (response) => {
	  	let statuses = response.statuses;
	  	let count = statuses.length
	    if (count === 0) {
	      await asyncType("No tweets found!");
	      return;
	    }
	    const bullets = statuses.map((i: any) => `https://twitter.com/i/web/status/${i.id_str}`);
	    console.log(bullets);
	    await pushBullets(bullets, "Tweets");
	  });
	})
	.catch((e) => asyncType(`Error: ${e.message}`));

};

addButtonListener(TWITTER_REFERENCES_COMMAND, twitterReferencesListener);