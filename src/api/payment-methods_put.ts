import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers, stripe } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active Session",
        headers: headers(event),
      };
    }
    const customer = user?.privateMetadata?.stripeId as string;
    const { id } = JSON.parse(event.body || "{}");
    if (!id) {
      return {
        statusCode: 400,
        body: "id is required",
        headers: headers(event),
      };
    }

    return stripe.paymentMethods.retrieve(id).then((pm) => {
      if (!pm.customer) {
        return {
          statusCode: 400,
          body: "No customer attached to payment method",
          headers: headers(event),
        };
      }
      if (pm.customer !== customer) {
        return {
          statusCode: 400,
          body: "Payment method not attached to the current user",
          headers: headers(event),
        };
      }
      return stripe.customers
        .update(pm.customer as string, {
          invoice_settings: {
            default_payment_method: pm.id,
          },
        })
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ success: true }),
          headers: headers(event),
        }));
    });
  });
