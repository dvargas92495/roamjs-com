import axios from "axios";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getGithubOpts, userError, wrapAxios } from "../lambda-helpers";

export const handler = async (event: APIGatewayProxyEvent) => {
  const { repository, project, column } = event.queryStringParameters;
  if (!repository) {
    return userError("repository is required");
  }
  if (!project) {
    return userError("project is required");
  }
  if (!column) {
    return userError("column is required");
  }
  const opts = getGithubOpts();
  return axios(
    `https://api.github.com/repos/${repository}/projects`,
    opts
  ).then((projects) => {
    const projectName = decodeURIComponent(project).toUpperCase();
    const projectObj = projects.data.find(
      (p: any) => p.name.toUpperCase() === projectName
    );
    if (!projectObj) {
      return userError(
        `Could not find project ${project} in repository ${repository}`
      );
    }
    return axios(projectObj.columns_url, opts).then((columns) => {
      const columnName = decodeURIComponent(column).toUpperCase();
      const columnObj = columns.data.find(
        (c: any) => c.name.toUpperCase() === columnName
      );
      if (!columnObj) {
        return userError(
          `Could not find column ${column} in project ${project} in repository ${repository}`
        );
      }
      return wrapAxios(
        axios(columnObj.cards_url, opts).then((r) => ({
          ...r,
          data: r.data.map((i: any) => ({
            ...i,
            html_link: `${projectObj.html_link}#card-${i.id}`,
          })),
        }))
      );
    });
  });
};
