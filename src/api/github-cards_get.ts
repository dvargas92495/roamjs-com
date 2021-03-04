import axios from "axios";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getGithubOpts, userError, wrapAxios } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { repository, project, column } = event.queryStringParameters;
  if (!repository) {
    return userError("repository is required", event);
  }
  if (!project) {
    return userError("project is required", event);
  }
  if (!column) {
    return userError("column is required", event);
  }
  const opts = getGithubOpts();
  return axios(
    `https://api.github.com/repos/${repository}/projects`,
    opts
  ).then((projects) => {
    const projectName = decodeURIComponent(project).toUpperCase();
    const projectObj = projects.data.find(
      (p: { name: string }) => p.name.toUpperCase() === projectName
    );
    if (!projectObj) {
      return userError(
        `Could not find project ${project} in repository ${repository}`,
        event
      );
    }
    return axios(projectObj.columns_url, opts).then((columns) => {
      const columnName = decodeURIComponent(column).toUpperCase();
      const columnObj = columns.data.find(
        (c: { name: string }) => c.name.toUpperCase() === columnName
      );
      if (!columnObj) {
        return userError(
          `Could not find column ${column} in project ${project} in repository ${repository}`,
          event
        );
      }
      return wrapAxios(
        axios(columnObj.cards_url, opts).then((r) => ({
          ...r,
          data: r.data.map((i: { html_url: string; id: string }) => ({
            ...i,
            html_url: `${projectObj.html_url}#card-${i.id}`,
          })),
        })),
        event
      );
    });
  });
};
