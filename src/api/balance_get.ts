import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Stripe } from "stripe";
import { getClerkUser, headers, stripe } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then(async (user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active Session",
        headers: headers(event),
      };
    }
    const customer = user.privateMetadata?.stripeId as string;
    return stripe.customers
      .retrieve(customer)
      .then((customer) => ({
        statusCode: 200,
        body: JSON.stringify({
          balance:
            parseInt((customer as Stripe.Customer).metadata.balance || "0") /
            100,
        }),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.message,
        headers: headers(event),
      }));
  });
