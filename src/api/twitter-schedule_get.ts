import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamo, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const token = event.headers.Authorization;

  return users.getUserList().then((users) => {
    const user = users.find(
      (user) =>
        (user.privateMetadata as { socialToken: string }).socialToken === token
    );
    if (!user) {
      return {
        statusCode: 401,
        body: "Invalid token",
        headers: headers(event),
      };
    }
    return dynamo
      .query({
        TableName: "RoamJSSocial",
        IndexName: "user-index",
        ExpressionAttributeNames: {
          "#u": "userId",
          "#c": "channel",
        },
        ExpressionAttributeValues: {
          ":u": { S: user.id },
          ":c": { S: "twitter" },
        },
        KeyConditionExpression: "#u = :u AND #c = :c",
      })
      .promise()
      .then(({ Items }) => ({
        statusCode: 200,
        body: JSON.stringify({
          scheduledTweets: (Items || []).map((item) => ({
            uuid: item.uuid.S,
            blockUid: JSON.parse(item.payload.S).blocks[0].uid,
            createdDate: item.created.S,
            scheduledDate: item.date.S,
            status: item.status.S,
            message: item.message?.S,
          })),
        }),
        headers: headers(event),
      }));
  });
};
