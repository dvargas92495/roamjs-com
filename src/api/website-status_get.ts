import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import axios from "axios";
import { headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const {
    data: { website },
  } = await axios.get(
    `${process.env.FLOSS_API_URL}/auth-user-metadata?key=website`,
    {
      headers: { Authorization: event.headers.Authorization },
    }
  );

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

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...website,
      status: statuses.Items ? statuses.Items[0].status.S : "INITIALIZING",
    }),
    headers,
  };
};
