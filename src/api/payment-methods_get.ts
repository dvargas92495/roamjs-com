import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { Stripe } from "stripe";
import { headers, getClerkUser, stripe } from "../lambda-helpers";

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
    const defaultPaymentMethod = await stripe.customers
      .retrieve(customer, {
        expand: ["invoice_settings.default_payment_method"],
      })
      .then(
        (c) =>
          (c as Stripe.Customer).invoice_settings
            .default_payment_method as Stripe.PaymentMethod
      );
    const paymentMethods = await stripe.paymentMethods
      .list({ customer, type: "card" })
      .then((r) =>
        r.data.map((pm) => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
        }))
      );
    return {
      statusCode: 200,
      body: JSON.stringify({
        paymentMethods,
        defaultPaymentMethod: defaultPaymentMethod && {
          id: defaultPaymentMethod.id,
          brand: defaultPaymentMethod.card?.brand,
          last4: defaultPaymentMethod.card?.last4,
        },
      }),
      headers: headers(event),
    };
  });
