import axios from "axios";
import {
  Contracts,
  getFlossActiveContracts,
  getGithubOpts,
  headers,
} from "../lambda-helpers";

export const handler = async () => {
  const opts = getGithubOpts();
  const flossIssues = await getFlossActiveContracts()
    .then((r) =>
      r.issues.filter(({ link }) =>
        link.startsWith(
          "https://github.com/dvargas92495/roam-js-extensions/issues"
        )
      )
    )
    .catch(() => [] as Contracts);
  const issuesWithContract = new Set(flossIssues.map((i) => i.link));
  const githubIssuesByLink = await axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=enhancement",
      opts
    )
    .then((r) =>
      Object.fromEntries<{
        name: string,
        htmlUrl: string,
        createdAt: string,
      }>(
        r.data.map((issue: { title: string; html_url: string, created_at: string }) => [
          issue.html_url,
          {
            name: issue.title,
            htmlUrl: issue.html_url,
            createdAt: issue.created_at,
          },
        ])
      )
    );
  const body = [
    ...flossIssues.map((i) => ({
      total: i.reward,
      ...githubIssuesByLink[i.link],
    })),
    ...Object.keys(githubIssuesByLink)
      .filter((l) => !issuesWithContract.has(l))
      .sort((a, b) => githubIssuesByLink[a].createdAt.localeCompare(githubIssuesByLink[b].createdAt))
      .map((i) => ({ total: 0, ...githubIssuesByLink[i] })),
  ];
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers,
  };
};
