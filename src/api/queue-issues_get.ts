import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios, { AxiosResponse } from "axios";
import {
  Contracts,
  getFlossActiveContracts,
  getGithubOpts,
  headers,
} from "../lambda-helpers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const label = event.queryStringParameters.label || "enhancement";
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
  const fundingByIssueLink = flossIssues.reduce(
    (rewards, { link, reward }) => ({
      ...rewards,
      [link]: reward + (rewards[link] || 0),
    }),
    {} as { [link: string]: number }
  );
  const body = await axios
    .get(
      `https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=${label}`,
      opts
    )
    .then(
      (
        r: AxiosResponse<
          {
            title: string;
            html_url: string;
            created_at: string;
          }[]
        >
      ) =>
        r.data
          .map((issue) => ({
            name: issue.title,
            htmlUrl: issue.html_url,
            createdAt: issue.created_at,
            total: fundingByIssueLink[issue.html_url] || 0,
          }))
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
