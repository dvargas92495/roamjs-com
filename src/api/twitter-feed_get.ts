import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import { headers, twitterOAuth } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const [key, secret] = event.headers.Authorization.split(":");
  const { to, from } = event.queryStringParameters;
  const toDate = new Date(to);
  const fromDate = new Date(from);
  const getFavorites = async ({
    maxId,
  }: {
    maxId?: string;
  }): Promise<{ id: string }[]> => {
    const url = `https://api.twitter.com/1.1/favorites/list.json?count=200${
      maxId ? `&max_id=${maxId}` : ""
    }&tweet_mode=extended`;
    const oauthHeaders = twitterOAuth.toHeader(
      twitterOAuth.authorize(
        {
          url,
          method: "GET",
        },
        { key, secret }
      )
    );
    return axios
      .get<
        {
          id_str: string;
          created_at: string;
          full_text: string;
          user: { name: string; screen_name: string };
        }[]
      >(url, {
        headers: oauthHeaders,
      })
      .then(async (r) => {
        const tweets = r.data
          .filter(
            (t) =>
              !isBefore(new Date(t.created_at), fromDate) &&
              !isAfter(new Date(t.created_at), toDate)
          )
          .map((t) => ({
            id: t.id_str,
            text: t.full_text,
            handle: t.user?.screen_name,
            author: t.user?.name,
          }));
        const oldestTweet = r.data.slice(-1)[0];
        if (
          r.data.length > 1 &&
          isAfter(new Date(oldestTweet.created_at), fromDate)
        ) {
          return [
            ...tweets,
            ...(await getFavorites({ maxId: oldestTweet.id_str })),
          ];
        } else {
          return tweets;
        }
      });
  };

  return getFavorites({})
    .then((tweets) => ({
      statusCode: 200,
      body: JSON.stringify({
        tweets,
      }),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify({ message: e.message, ...e.response?.data }),
      headers: headers(event),
    }));
};
