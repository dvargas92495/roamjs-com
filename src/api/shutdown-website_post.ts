import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkUser, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, subscriptionId } = JSON.parse(event.body || "{}");

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers,
    };
  }

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const opts = {
    headers: {
      Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
    },
  };
  const cancelled = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-cancel`,
      {
        subscriptionId,
      },
      opts
    )
    .then((r) => r.data.success);
  if (!cancelled) {
    return {
      statusCode: 500,
      body: "Failed to cancel RoamJS Site subscription",
      headers,
    };
  }

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `launch_${graph}`,
        },
        date: {
          S: new Date().toJSON(),
        },
        status: {
          S: "SHUTTING DOWN",
        },
      },
    })
    .promise();

  await dynamo.updateItem({
    TableName: "RoamJSClerkUsers",
    Key: { id: { S: user.id } },
    ExpressionAttributeNames: {
      "#WG": "website_graph",
      "#WD": "website_domain",
    },
    UpdateExpression: "REMOVE #WG, #WD",
  });

  await lambda
    .invoke({
      FunctionName: "RoamJS_shutdown",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers,
  };
};
