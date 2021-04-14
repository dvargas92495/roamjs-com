import { users } from "@clerk/clerk-sdk-node";
import AWS from "aws-sdk";
import { authenticate, emptyResponse, headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

const getProgressProps = (
  items?: AWS.DynamoDB.ItemList,
  deployItems?: AWS.DynamoDB.ItemList
) => {
  if (!items) {
    return { progress: 0, progressType: "LAUNCHING" };
  }
  const launchIndex = items.findIndex((s) => s.status.S === "INITIALIZING") + 1;
  const shutdownIndex =
    items.findIndex((s) => s.status.S === "SHUTTING DOWN") + 1;
  if (!shutdownIndex || launchIndex < shutdownIndex) {
    const deployIndex = deployItems.findIndex((s) =>
      ["SUCCESS", "FAILURE"].includes(s.status.S)
    );
    if (deployIndex) {
      return { progress: deployIndex / 5, progressType: "DEPLOYING" };
    }
    return { progress: launchIndex / 26, progressType: "LAUNCHING" };
  } else {
    return { progress: shutdownIndex / 18, progressType: "SHUTTING DOWN" };
  }
};

export const handler = authenticate(async (event) => {
  const userId = event.headers.Authorization;
  const graph = await users
    .getUser(userId)
    .then((r) => (r.privateMetadata as { websiteGraph: string }).websiteGraph);

  if (!graph) {
    return emptyResponse(event);
  }

  if (graph !== event.queryStringParameters.graph) {
    return {
      statusCode: 401,
      body: "There's already a live static site with this token",
      headers: headers(event),
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
      Limit: 100,
      ScanIndexForward: false,
      IndexName: "primary-index",
    })
    .promise()
    .catch(() => ({ Items: [] }));
  if (!statuses.Items.length) {
    return emptyResponse(event);
  }

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

  return {
    statusCode: 200,
    body: JSON.stringify({
      graph,
      status: statuses.Items ? statuses.Items[0].status.S : "INITIALIZING",
      statusProps: statuses.Items ? statuses.Items[0].status_props?.S : "{}",
      deploys: deploys
        .slice(0, 10)
        .map((d) => ({ date: d.date.S, status: d.status.S, uuid: d.uuid.S })),
      ...getProgressProps(statuses.Items, deployStatuses.Items),
    }),
    headers: headers(event),
  };
}, "staticSite");
