import axios from "axios";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { wrapAxios, getGithubOpts, userError } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { repository } = event.queryStringParameters;
  if (!repository) {
    return userError("repository is required", event);
  }
  const opts = getGithubOpts();
  return wrapAxios(
    axios(`https://api.github.com/repos/${repository}/projects`, opts),
    event
  );
};
