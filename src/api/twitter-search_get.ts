import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { wrapAxios, userError, getTwitterOpts } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { username, query } = event.queryStringParameters;
  if (!username) {
    return userError("username is required", event);
  }
  if (!query) {
    return userError("query is required", event);
  }

  const opts = await getTwitterOpts(event);

  return wrapAxios(
    axios.get(
      `https://api.twitter.com/1.1/search/tweets.json?q=from%3A${username}%20${encodeURIComponent(
        query
      )}%20AND%20-filter:retweets`,
      opts
    ),
    event
  );
};
