import axios from "axios";
import { wrapAxios, getGithubOpts, userError } from "../lambda-helpers";
import { APIGatewayEvent } from "aws-lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { username } = event.queryStringParameters;
  if (!username) {
    return userError("username is required");
  }
  const opts = getGithubOpts();
  return wrapAxios(
    axios(`https://api.github.com/repos/users/${username}/repos`, opts)
  );
};