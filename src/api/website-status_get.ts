import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import axios from "axios";
import { headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const website =
    event.queryStringParameters ||
    (await axios
      .get(`${process.env.FLOSS_API_URL}/auth-user-metadata?key=website`, {
        headers: { Authorization: event.headers.Authorization },
      })
      .then((r) => r.data.website));

  if (!website) {
    return {
      statusCode: 204,
      body: JSON.stringify({}),
      headers,
    };
  }

  const statuses = await dynamo
    .query({
      TableName: "RoamJSWebsiteStatuses",
      KeyConditionExpression: "action_graph = :a",
      ExpressionAttributeValues: {
        ":a": {
          S: `launch_${website.graph}`,
        },
      },
      Limit: 1,
      ScanIndexForward: false,
      IndexName: "primary-index",
    })
    .promise();

  const deployStatuses = await dynamo
    .query({
      TableName: "RoamJSWebsiteStatuses",
      KeyConditionExpression: "action_graph = :a",
      ExpressionAttributeValues: {
        ":a": {
          S: `deploy_${website.graph}`,
        },
      },
      ScanIndexForward: false,
      IndexName: "primary-index",
    })
    .promise();
  const successDeployStatuses = deployStatuses.Items.filter(
    (s) => s.status.S === "SUCCESS"
  );
  const deploys =
    successDeployStatuses[0] === deployStatuses.Items[0]
      ? successDeployStatuses
      : [deployStatuses.Items[0], ...successDeployStatuses];

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...website,
      status: statuses.Items ? statuses.Items[0].status.S : "INITIALIZING",
      statusProps: statuses.Items ? statuses.Items[0].status_props?.S : "{}",
      deploys: deploys
        .slice(0, 10)
        .map((d) => ({ date: d.date.S, status: d.status.S, uuid: d.uuid.S })),
    }),
    headers,
  };
};
