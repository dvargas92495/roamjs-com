import { createConfigObserver } from "roamjs-components";
import { runExtension } from "../entry-helpers";
import FacebookLogo from "../assets/Facebook.svg";

const ID = "facebook";
const CONFIG = `roam/js/${ID}`;

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              type: "oauth",
              title: "oauth",
              options: {
                ServiceIcon: FacebookLogo,
                service: "service",
                getPopoutUrl: () => Promise.resolve("https://facebook.com"),
                getAuthData: (d) => Promise.resolve(JSON.parse(d)),
              },
              description: "Log in with Facebook by clicking the button below",
            },
          ],
        },
      ],
    },
  });
});
