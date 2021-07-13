import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamo, emptyResponse } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { state, auth } = JSON.parse(event.body);
  return dynamo
    .putItem({
      TableName: "RoamJSAuth",
      Item: {
        id: { S: state },
        auth: { S: auth },
        date: { S: new Date().toJSON() },
      },
    })
    .promise()
    .then(() => emptyResponse(event));
};
