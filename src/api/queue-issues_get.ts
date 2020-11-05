import axios from "axios";
import { getGithubOpts, wrapAxios } from "../lambda-helpers";

export const handler = () => {
  const opts = getGithubOpts();
  return wrapAxios(axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=enhancement",
      opts
    )
    .then((r) =>
      r.data.map((issue: { title: string; body: string }) => ({
        name: issue.title,
        description: issue.body,
        total: 0,
      }))
    ));
};
