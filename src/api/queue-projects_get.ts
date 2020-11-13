import axios from "axios";
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
  const projectsWithContract = new Set(flossProjects.map((p) => p.link));
  const githubProjectsByLink = await axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/projects",
      opts
    )
    .then((r) =>
      Object.fromEntries<{name: string, htmlUrl:string, createdAt: string}>(
        r.data
          .filter(
            (project: { name: string }) => project.name !== "Site Improvements"
          )
          .map((project: { name: string; html_url: string, created_at: string }) => [
            project.html_url,
            {
              name: project.name,
              htmlUrl: project.html_url,
              createdAt: project.created_at
            },
          ])
      )
    );
  const body = [
    ...flossProjects.map((i) => ({
      total: i.reward,
      ...githubProjectsByLink[i.link],
    })),
    ...Object.keys(githubProjectsByLink)
      .filter((l) => !projectsWithContract.has(l))
      .sort((a, b) => githubProjectsByLink[a].createdAt.localeCompare(githubProjectsByLink[b].createdAt))
      .map((i) => ({ total: 0, ...githubProjectsByLink[i] })),
  ];

  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers,
  };
};
