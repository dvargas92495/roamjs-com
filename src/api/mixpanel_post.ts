import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { headers, mixpanel } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const {eventName, properties} = JSON.parse(event.body || '{}');
  mixpanel.track(eventName, properties);
  return {
    statusCode: 204,
    body: JSON.stringify({}),
    headers,
  };
};
