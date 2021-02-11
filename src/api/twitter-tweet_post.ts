import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../lambda-helpers";
import querystring from "querystring";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { key, secret, content, in_reply_to_status_id } = JSON.parse(
    event.body || "{}"
  );
  const data = in_reply_to_status_id
    ? { status: content, in_reply_to_status_id }
    : { status: content };
  const url = `https://api.twitter.com/1.1/statuses/update.json?${querystring
    .stringify(data)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")}`;
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
        headers: oauthHeaders,
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
