import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { flossGet } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  flossGet({
    event,
    path: `stripe-is-subscribed?product=${encodeURI(
      event.queryStringParameters?.product
    )}`,
  });
