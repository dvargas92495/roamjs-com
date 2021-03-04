import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { wrapAxios, getGithubOpts } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const opts = getGithubOpts();
  return wrapAxios(axios(`https://api.github.com/issues`, opts), event);
};
