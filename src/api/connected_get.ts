import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const key = event.queryStringParameters?.key;
  if (!key) {
    return {
      statusCode: 400,
      body: "key parameter is required",
      headers: headers(event),
    };
  }

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers: headers(event),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ connected: !!user.privateMetadata[key] }),
    headers: headers(event),
  };
};
