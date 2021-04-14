import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios, { AxiosError } from "axios";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const { url } = JSON.parse(event.body);
  return axios
    .get(
      `http://iframe.ly/api/oembed?url=${url}&api_key=${process.env.IFRAMELY_API_KEY}&iframe=card-small`
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }))
    .catch((e: Error & AxiosError) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers: headers(event),
    }));
};
