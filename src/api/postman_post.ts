import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => ({
  statusCode: 200,
  body: JSON.stringify({
    body: `This was the body sent: ${event.body}`,
    headers: `These were the headers sent: ${event.headers}`,
  }),
  headers,
});
