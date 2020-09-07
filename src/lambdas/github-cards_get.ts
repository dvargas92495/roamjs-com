import axios from "axios";
import { APIGatewayProxyEvent } from "aws-lambda";
import { githubRequestHeaders, userError, wrapAxios } from "../lambda-helpers";

const personalAccessToken = process.env.GITHUB_TOKEN || "";

export const handler = async (event: APIGatewayProxyEvent) => {
  const { repository, project, column } = event.queryStringParameters;
  const headers = githubRequestHeaders(personalAccessToken);
  return axios(
    `https://api.github.com/repos/dvargas92495/${repository}/projects`,
    { headers }
  ).then((projects) => {
    const projectObj = projects.data.find((p: any) => p.name === project);
    if (!projectObj) {
      return userError(
        `Could not find project ${project} in repository ${repository}`
      );
    }
    return axios(projectObj.columns_url, { headers }).then((columns) => {
      const columnObj = columns.data.find((c: any) => c.name === column);
      if (!columnObj) {
        return userError(
          `Could not find column ${column} in project ${project} in repository ${repository}`
        );
      }
      return wrapAxios(axios(columnObj.cards_url, { headers }));
    });
  });
};
