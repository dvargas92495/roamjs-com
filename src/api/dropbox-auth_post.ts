import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import headers from "roamjs-components/backend/headers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const data = JSON.parse(event.body || "{}");
  const params = new URLSearchParams();
  Object.keys(data).forEach((k) => params.append(k, data[k]));

  return axios
    .post("https://api.dropboxapi.com/oauth2/token", params, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.DROPBOX_CLIENT_ID}:${process.env.DROPBOX_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((r) => {
      if (data.grant_type === "refresh_token") {
        return {
          statusCode: 200,
          body: JSON.stringify(r.data),
          headers,
        };
      }
      return axios
        .post(
          "https://api.dropboxapi.com/2/users/get_account",
          { account_id: r.data.account_id },
          { headers: { Authorization: `Bearer ${r.data.access_token}` } }
        )
        .then((u) => ({
          statusCode: 200,
          body: JSON.stringify({ ...r.data, label: u.data.name.display_name }),
          headers,
        }));
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
