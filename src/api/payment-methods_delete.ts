import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
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
    const customer = user?.privateMetadata?.stripeId as string;
    const paymentMethodId = event.queryStringParameters?.payment_method_id;
    if (!paymentMethodId) {
      return {
        statusCode: 400,
        body: "payment_method_id is required",
        headers: headers(event),
      };
    }
    const paymentMethodCustomer = await stripe.paymentMethods
      .retrieve(paymentMethodId)
      .then((r) => r.customer as string);
    if (paymentMethodCustomer !== customer) {
      return {
        statusCode: 400,
        body: "User does not have access to the provided payment method",
        headers: headers(event),
      };
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    return {
      statusCode: 204,
      body: JSON.stringify({}),
      headers: headers(event),
    };
  });
