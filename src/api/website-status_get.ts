import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { getClerkUser, headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers,
    };
  }

  const graph = await users
    .getUser(user.id)
    .then((r) => (r.privateMetadata as { websiteGraph: string }).websiteGraph);

  if (!graph) {
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
          S: `launch_${graph}`,
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
          S: `deploy_${graph}`,
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
      graph,
      status: statuses.Items ? statuses.Items[0].status.S : "INITIALIZING",
      statusProps: statuses.Items ? statuses.Items[0].status_props?.S : "{}",
      deploys: deploys
        .slice(0, 10)
        .map((d) => ({ date: d.date.S, status: d.status.S, uuid: d.uuid.S })),
    }),
    headers,
  };
};
