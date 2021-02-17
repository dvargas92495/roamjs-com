import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../lambda-helpers";
import querystring from "querystring";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { key, secret, params } = JSON.parse(event.body || "{}");
  const url = `https://upload.twitter.com/1.1/media/upload.json?${querystring.stringify(
    params
  )}`;
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize(
      {
        url,
        method: "POST",
      },
      { key, secret }
    )
  );

  return axios
    .post(
      url,
      {},
      {
        headers: { ...oauthHeaders, "Content-Type": "multipart/form-data" },
      }
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify({ message: e.message, url, ...e.response?.data }),
      headers,
    }));
};
