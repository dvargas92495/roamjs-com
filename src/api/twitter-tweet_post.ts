import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { oauthData, content } = JSON.parse(event.body || "{}");
  const url = `https://api.twitter.com/1.1/statuses/update.json?status=${encodeURIComponent(
    content
  )}`;
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize({
      data: oauthData,
      url,
      method: "POST",
    })
  );

  return axios
    .post(url, oauthData, {
      headers: oauthHeaders,
    })
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
