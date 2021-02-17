import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { getClerkUser, headers } from "../lambda-helpers";

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) =>
    user
      ? dynamo
          .getItem({
            TableName: "RoamJSClerkUsers",
            Key: { id: { S: user.id } },
          })
          .promise()
          .then((r) => ({
            statusCode: 200,
            body: JSON.stringify({ balance: r.Item?.balance?.N || 0 }),
            headers,
          }))
      : {
          statusCode: 401,
          body: "No Active Session",
          headers,
        }
  );
