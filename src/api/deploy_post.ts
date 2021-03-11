import { authenticate, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import { users } from "@clerk/clerk-sdk-node";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = authenticate(async (event) => {
  const user = await users.getUser(event.headers.Authorization);
  const { websiteGraph, websiteDomain } = user.privateMetadata as {
    websiteGraph: string;
    websiteDomain: string;
  };

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `deploy_${websiteGraph}`,
        },
        date: {
          S: new Date().toJSON(),
        },
        status: {
          S: "STARTING DEPLOY",
        },
      },
    })
    .promise();

  await lambda
    .invoke({
      FunctionName: "RoamJS_deploy",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: websiteGraph,
        domain: websiteDomain,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
});
