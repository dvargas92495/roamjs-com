import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import { bareSuccessResponse, dynamo, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { scheduleDate, token, oauth, payload } = JSON.parse(
    event.body || "{}"
  );
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
    const uuid = v4();
    return dynamo
      .putItem({
        TableName: "RoamJSSocial",
        Item: {
          uuid: { S: uuid },
          created: { S: new Date().toJSON() },
          date: { S: scheduleDate },
          oauth: { S: oauth },
          payload: { S: payload },
          status: { S: "PENDING" },
          userId: { S: user.id },
        },
      })
      .promise()
      .then(() => bareSuccessResponse(event));
  });
};
