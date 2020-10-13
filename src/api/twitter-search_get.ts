import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";
import { wrapAxios, userError, serverError, getTwitterOpts } from "../lambda-helpers";


export const handler = async (event: APIGatewayProxyEvent) => {
  const { username, query } = event.queryStringParameters;
  if (!username) {
    return userError("username is required");
  }
  if (!query) {
    return userError("query is required");
  }

  const opts = await getTwitterOpts();

  return wrapAxios(
    axios.get(
      `https://api.twitter.com/1.1/search/tweets.json?q=from%3A${username}%20${query}%20AND%20-filter:retweets`,
      opts
    )
  );
};
