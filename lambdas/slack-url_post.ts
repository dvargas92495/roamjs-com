import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import headers from "roamjs-components/backend/headers";
import querystring from "querystring";
import { WebClient } from "@slack/web-api";

const web = new WebClient();
delete web["axios"].defaults.headers["User-Agent"];

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const { code } = JSON.parse(event.body);
  return axios
    .post<{
      access_token: string;
      authed_user: { access_token: string; id: string };
      team: { name: string };
      ok: boolean;
      error: string;
    }>(
      "https://slack.com/api/oauth.v2.access",
      querystring.stringify({
        code,
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri: "https://roamjs.com/oauth?auth=true",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )
    .then((r) =>
      r.data.ok
        ? web.users
            .info({ token: r.data.access_token, user: r.data.authed_user.id })
            .then((u) =>
              u.ok
                ? {
                    statusCode: 200,
                    body: JSON.stringify({
                      token: r.data.access_token,
                      user_token: r.data.authed_user.access_token,
                      label: `${(u.user as { name: string }).name} (${
                        r.data.team.name
                      })`,
                    }),
                    headers,
                  }
                : {
                    statusCode: 500,
                    body: r.data.error,
                    headers,
                  }
            )
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
