import axios from "axios";
import { APIGatewayProxyEvent } from "aws-lambda";
import { wrapAxios, githubRequestHeaders } from "../lambda-helpers";

const personalAccessToken = process.env.GITHUB_TOKEN || "";

export const handler = async (event: APIGatewayProxyEvent) => {
  const { repository } = event.queryStringParameters;
  const headers = githubRequestHeaders(personalAccessToken);
  return wrapAxios(
    axios(
      `https://api.github.com/repos/dvargas92495/${repository}/projects`,
      { headers }
    )
  );
};
