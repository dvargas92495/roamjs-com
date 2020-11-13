import axios, { AxiosResponse } from "axios";
import {
  Contracts,
  getFlossActiveContracts,
  getGithubOpts,
  headers,
} from "../lambda-helpers";

export const handler = async () => {
  const opts = getGithubOpts();

  const flossProjects = await getFlossActiveContracts()
    .then((r) =>
      r.projects.filter(({ link }) =>
        link.startsWith(
          "https://github.com/dvargas92495/roam-js-extensions/projects"
        )
      )
    )
    .catch(() => [] as Contracts);
  const fundingByProjectLink = flossProjects.reduce(
    (rewards, { link, reward }) => ({
      ...rewards,
      [link]: reward + (rewards[link] || 0),
    }),
    {} as { [link: string]: number }
  );
  const body = await axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/projects",
      opts
    )
    .then((r: AxiosResponse<{
      name: string;
      html_url: string;
      created_at: string;
    }[]>) =>
      r.data
        .filter(
          (project: { name: string }) => project.name !== "Site Improvements"
        )
        .map(
          (project) => ({
            name: project.name,
            htmlUrl: project.html_url,
            createdAt: project.created_at,
            total: fundingByProjectLink[project.html_url] || 0,
          })
        )
        .sort((a, b) =>
          a.total !== b.total
            ? b.total - a.total
            : a.createdAt.localeCompare(b.createdAt)
        )
    );

  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers,
  };
};
