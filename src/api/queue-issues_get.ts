import axios from "axios";
import { getGithubOpts, headers, wrapAxios } from "../lambda-helpers";

export const handler = () => {
  const opts = getGithubOpts();
  return axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=enhancement",
      opts
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data.map((issue: { title: string }) => ({
        name: issue.title,
        total: 0,
      }))),
      headers,
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
