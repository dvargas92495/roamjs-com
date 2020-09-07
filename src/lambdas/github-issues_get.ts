import axios from "axios";
import { wrapAxios, githubRequestHeaders } from "../lambda-helpers";

const personalAccessToken = process.env.GITHUB_TOKEN || "";

export const handler = async () => {
  const headers = githubRequestHeaders(personalAccessToken);
  return wrapAxios(axios(`https://api.github.com/repos/issues`, { headers }));
};
