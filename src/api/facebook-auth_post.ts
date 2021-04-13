import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios
    .get(
      `https://graph.facebook.com/v10.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}&redirect_uri=https://roamjs.com/oauth?auth=true`
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers: headers(event),
    }));
};
