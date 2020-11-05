import axios from "axios";
import { getGithubOpts } from "../lambda-helpers";

export const handler = () => {
  const opts = getGithubOpts();
  return axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/projects",
      opts
    )
    .then((r) =>
      r.data.map((project: { name: string; body: string }) => ({
        name: project.name,
        description: project.body,
        total: 0,
      }))
    );
};
