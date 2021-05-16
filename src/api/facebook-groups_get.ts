import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  const accessToken = event.queryStringParameters?.accessToken;
  return axios
    .get(
      `https://graph.facebook.com/${userId}/groups?access_token=${accessToken}`
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({ groups: r.data.data }),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers: headers(event),
    }));
};
