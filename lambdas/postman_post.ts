import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "roamjs-components/backend/headers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const filteredHeaders = Object.fromEntries(
    Object.keys(event.headers)
      .filter(
        (k) =>
          !k.toLowerCase().includes("cloudfront") &&
          !k.toLowerCase().includes("amz") &&
          !event.headers[k].toLowerCase().includes("cloudfront")
      )
      .map((k) => [k, event.headers[k]])
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      body: `This was the body sent: ${JSON.stringify(
        JSON.parse(event.body),
        null,
        4
      )}`,
      headers: `These were the headers sent: ${JSON.stringify(
        filteredHeaders,
        null,
        4
      )}`,
    }),
    headers,
  };
};
