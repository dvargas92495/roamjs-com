import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import { headers, twitterOAuth } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const [key, secret] = event.headers.Authorization.split(":");
  const { to, from } = event.queryStringParameters;
  const url = `https://api.twitter.com/1.1/favorites/list.json?count=200`;
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize(
      {
        url,
        method: "GET",
      },
      { key, secret }
    )
  );
  const toDate = new Date(to);
  const fromDate = new Date(from);

  return axios
    .get<{ id_str: string; created_at: string }[]>(url, {
      headers: oauthHeaders,
    })
    .then((r) => {
      const tweets = r.data
        .filter(
          (t) =>
            !isBefore(new Date(t.created_at), fromDate) &&
            !isAfter(new Date(t.created_at), toDate)
        )
        .map((t) => ({
          id: t.id_str,
        }));
      return {
        statusCode: 200,
        body: JSON.stringify({
          tweets,
        }),
        headers: headers(event),
      };
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify({ message: e.message, url, ...e.response?.data }),
      headers: headers(event),
    }));
};
