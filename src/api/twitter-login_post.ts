import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize({
      data: {
        oauth_callback: "https://roamjs.com/oauth?auth=true",
      },
      url: "https://api.twitter.com/oauth/request_token",
      method: "POST",
    })
  );

  return axios
    .post(
      "https://api.twitter.com/oauth/request_token",
      {
        oauth_callback: `https://roamjs.com/oauth?auth=true`,
      },
      { headers: oauthHeaders }
    )
    .then((r) => {
      const parsedData = Object.fromEntries(
        r.data.split("&").map((s: string) => s.split("="))
      );
      if (parsedData.oauth_callback_confirmed) {
        return {
          statusCode: 200,
          body: JSON.stringify({ token: parsedData.oauth_token }),
          headers: headers(event),
        };
      } else {
        return {
          statusCode: 500,
          body: "Oauth Callback was not Confirmed",
          headers: headers(event),
        };
      }
    })
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers: headers(event),
    }));
};
