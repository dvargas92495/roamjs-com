import { users } from "@clerk/clerk-sdk-node";
import AWS from "aws-sdk";
import { authenticate, emptyResponse, headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = authenticate(async (event) => {
  const userId = event.headers.Authorization;
  const graph = await users
    .getUser(userId)
    .then((r) => (r.privateMetadata as { websiteGraph: string }).websiteGraph);

  if (!graph) {
    return emptyResponse(event);
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
      Limit: 30,
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
  const successDeployStatuses = deployStatuses.Items.filter((s) =>
    ["SUCCESS", "FAILURE"].includes(s.status.S)
  );
  const deploys =
    successDeployStatuses[0] === deployStatuses.Items[0]
      ? successDeployStatuses
      : [deployStatuses.Items[0], ...successDeployStatuses];
  const progress = statuses.Items
    ? statuses.Items.findIndex((s) =>
        ["INITIALIZING", "SHUTTING DOWN"].includes(s.status.S)
      ) + 1
    : 0;

  return {
    statusCode: 200,
    body: JSON.stringify({
      graph,
      status: statuses.Items ? statuses.Items[0].status.S : "INITIALIZING",
      statusProps: statuses.Items ? statuses.Items[0].status_props?.S : "{}",
      deploys: deploys
        .slice(0, 10)
        .map((d) => ({ date: d.date.S, status: d.status.S, uuid: d.uuid.S })),
      progress: progress / 30,
    }),
    headers: headers(event),
  };
});
