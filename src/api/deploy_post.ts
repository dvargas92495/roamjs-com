import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
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

  const website = await dynamo
    .getItem({
      TableName: "RoamJSClerkUsers",
      Key: { id: { S: user.id } },
    })
    .promise()
    .then((r) =>
      r.Item
        ? { graph: r.Item?.website_graph?.S, domain: r.Item?.website_domain?.S }
        : {}
    );

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `deploy_${website.graph}`,
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
        roamGraph: website.graph,
        domain: website.domain,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers,
  };
};
