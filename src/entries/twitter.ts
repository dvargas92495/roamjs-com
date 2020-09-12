import {
  addButtonListener,
  asyncType,
  pushBullets,
  getConfigFromPage,
} from "../entry-helpers";

// import Twitter from 'twitter';


const TWITTER_REFERENCES_COMMAND = "twitter references";

// let tw = new Twitter({
//   'consumer_key' : 'vCOqxSulLQ9dEDtz37CGVGXBl',
//   'consumer_secret' : 'zOx0Pb4N7kgz0XUnDesOVGZeEXhTi5y5xLCcO4lJJgtLWHBvMS',
//   'bearer_token' : 'AAAAAAAAAAAAAAAAAAAAAImJHgEAAAAAFgCgsnFGvAL3RAnlYcvHpw7Xt6U%3DKAOg5x2dz6xULgSRt1l3ltEz9eruOxB2OunZm6FG2UbIUjrWlJ'
// });



// const twimo = Twimo({
//     consumerKey: 'vCOqxSulLQ9dEDtz37CGVGXBl',
//     consumerSecret: 'zOx0Pb4N7kgz0XUnDesOVGZeEXhTi5y5xLCcO4lJJgtLWHBvMS',
// })({
//     token: '1219216196014182404-8LB2d7NQpDOFqLViQVmVcsQLHU44AR',
//     tokenSecret: '9k3CTWRJugkhNErMA89IvQsv09PQBQG1dfuylgcGo24YB',
// })

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}


const twitterReferencesListener = async () => {
	// https://stackoverflow.com/questions/35879943/twitter-api-authorization-fails-cors-preflight-in-browser
	const twitterSearch = fetch(`http://localhost:8000`, {
        headers: {
          Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAAImJHgEAAAAAFgCgsnFGvAL3RAnlYcvHpw7Xt6U%3DKAOg5x2dz6xULgSRt1l3ltEz9eruOxB2OunZm6FG2UbIUjrWlJ`,
        },
      });
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

	        // const bullets = statuses.map((i: any) => `[${i.title}](${i.html_url})`);
	        const bullets = statuses.map((i: any) => `@${i.user.screen_name}: ${i.text}`);
	        console.log(bullets);
	        // await asyncType("DONE!");
	        await pushBullets(bullets);
	      });
	    })
	    .catch((e) => asyncType(`Error: ${e.message}`));
	// await asyncType(JSON.stringify(response));
	// pushBullets(['Hey', 'this is twitter']);
};

addButtonListener(TWITTER_REFERENCES_COMMAND, twitterReferencesListener);