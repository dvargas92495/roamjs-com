import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import Mixpanel from "mixpanel";
import headers from "roamjs-components/backend/headers";

const mixpanel = process.env.MIXPANEL_TOKEN
  ? Mixpanel.init(process.env.MIXPANEL_TOKEN)
  : { track: () => console.log("track") };

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
