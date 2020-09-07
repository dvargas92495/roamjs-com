import axios from "axios";
import { wrapAxios, getGithubOpts } from "../lambda-helpers";

export const handler = async () => {
  const opts = getGithubOpts();
  return wrapAxios(
    axios(`https://api.github.com/repos/orgs/dvargas92495/repos`, opts)
  );
};