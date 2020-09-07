import axios from "axios";
import { APIGatewayProxyEvent } from "aws-lambda";
import { wrapAxios, getGithubOpts, userError } from "../lambda-helpers";

export const handler = async (event: APIGatewayProxyEvent) => {
  const { repository } = event.queryStringParameters;
  if (!repository) {
    return userError("repository is required");
  }
  const opts = getGithubOpts();
  return wrapAxios(
    axios(
      `https://api.github.com/repos/dvargas92495/${repository}/projects`,
      opts
    )
  );
};
