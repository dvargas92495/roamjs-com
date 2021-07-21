import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    const customer = user?.privateMetadata?.stripeId;
    const opts = {
      headers: {
        Authorization: `Bearer ${process.env.FLOSS_TOKEN}`,
        Origin: event.headers.origin || event.headers.Origin,
      },
    };
    return axios
      .post(
        `${process.env.FLOSS_API_URL}/stripe-payment-method?customer=${customer}`,
        {},
        opts
      )
      .then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: e.response.status,
        body: e.response.data,
        headers: headers(event),
      }));
  });
