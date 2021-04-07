import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";
import querystring from "querystring";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const { code, redirect_uri } = JSON.parse(event.body);
  return axios
    .post(
      "https://slack.com/api/oauth.v2.access",
      querystring.stringify({
        code,
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )
    .then((r) =>
      r.data.ok
        ? {
            statusCode: 200,
            body: JSON.stringify({
              token: r.data.access_token,
              user_token: r.data.authed_user.access_token,
            }),
            headers: headers(event),
          }
        : {
            statusCode: 500,
            body: r.data.error,
            headers: headers(event),
          }
    )
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers: headers(event),
    }));
};
