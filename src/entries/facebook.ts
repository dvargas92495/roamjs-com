import { createConfigObserver } from "roamjs-components";
import { runExtension } from "../entry-helpers";
import FacebookLogo from "../assets/Facebook.svg";
import axios from "axios";
import { createButtonObserver } from "roam-client";
import { render } from '../components/FacebookGroupOverlay';

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
                service: "Facebook",
                getPopoutUrl: () =>
                  Promise.resolve(
                    `https://www.facebook.com/v10.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&scope=publish_to_groups&response_type=code&redirect_uri=https://roamjs.com/oauth?auth=true`
                  ),
                getAuthData: (d) =>
                  axios
                    .post(
                      `${process.env.API_URL}/facebook-auth`,
                      JSON.parse(d)
                    )
                    .then((r) => r.data),
              },
              description: "Log in with Facebook by clicking the button below",
            },
          ],
        },
      ],
    },
  });

  createButtonObserver({
    shortcut: 'fb',
    attribute: 'facebook-group',
    render
  })
});
