import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => ({
  statusCode: 200,
  body: JSON.stringify({
    body: `This was the body sent: ${JSON.stringify(
      JSON.parse(event.body),
      null,
      4
    )}`,
    headers: `These were the headers sent: ${JSON.stringify(
      event.headers,
      null,
      4
    )}`,
  }),
  headers,
});
