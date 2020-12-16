import { APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { wrapAxios, getGithubOpts } from "../lambda-helpers";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  const opts = getGithubOpts();
  return wrapAxios(axios(`https://api.github.com/issues`, opts));
};
