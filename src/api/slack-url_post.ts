import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";
import querystring from "querystring";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const { code } = JSON.parse(event.body);
  return axios
    .post(
      "https://slack.com/api/oauth.v2.access",
      querystring.stringify({
        code,
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri: "https://roamjs.com/docs/extensions/slack",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )
    .then((r) =>
      r.data.ok
        ? {
            statusCode: 200,
            body: JSON.stringify({ webhook: r.data.incoming_webhook.url, token: r.data.access_token }),
            headers,
          }
        : {
            statusCode: 500,
            body: r.data.error,
            headers,
          }
    )
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
