import axios from "axios";
import { APIGatewayProxyEvent } from "aws-lambda";
import { wrapAxios, getGithubOpts } from "../lambda-helpers";

const personalAccessToken = process.env.GITHUB_TOKEN || "";

export const handler = async (event: APIGatewayProxyEvent) => {
  const { repository } = event.queryStringParameters;
  const opts = getGithubOpts(personalAccessToken);
  return wrapAxios(
    axios(
      `https://api.github.com/repos/dvargas92495/${repository}/projects`,
      opts
    )
  );
};
