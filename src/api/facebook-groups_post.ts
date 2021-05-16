import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { accessToken, groupId, message } = JSON.parse(event.body || "{}");
  return axios
    .post(`https://graph.facebook.com/${groupId}/feed`, {
      access_token: accessToken,
      message,
    })
    .then((r) =>
      axios
        .get(
          `https://graph.facebook.com/me?access_token=${r.data.access_token}`
        )
        .then((me) => ({
          statusCode: 200,
          body: JSON.stringify({ ...r.data, me }),
          headers: headers(event),
        }))
    )
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers: headers(event),
    }));
};
