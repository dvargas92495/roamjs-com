import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getClerkUser,
  getStripePriceId,
  headers,
  stripe,
} from "../lambda-helpers";
import type Stripe from "stripe";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers: headers(event),
    };
  }
  const { service, query } = JSON.parse(event.body || "{}") as {
    service: string;
    path: string;
    query: string;
  };
  const serviceCamelCase = service
    .split("-")
    .map((s, i) =>
      i == 0 ? s : `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
    )
    .join("");
  const priceId = await getStripePriceId(service);

  const customer = user.privateMetadata?.stripeId as string;
  const paymentMethod = await stripe.customers
    .retrieve(customer)
    .then((c) => c as Stripe.Customer)
    .then((c) => c.invoice_settings?.default_payment_method);
  const line_items = [{ price: priceId, quantity: 1 }];
  const origin = event.headers.Origin || event.headers.origin;

  const { active, id } = paymentMethod
    ? await stripe.subscriptions
        .create({
          customer,
          items: line_items,
        })
        .then((s) => ({ active: true, id: s.id }))
        .catch(() => ({ active: false, id: undefined }))
    : await stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
          line_items,
          mode: "subscription",
          success_url: `${origin}/extensions/${service}?success=true&${query}`,
          cancel_url: `${origin}/extensions/${service}?cancel=true`,
          metadata: {
            service: serviceCamelCase,
            userId: user.id,
            callback: `${process.env.API_URL}/finish-start-service`,
          },
        })
        .then((session) => ({ id: session.id, active: false }))
        .catch(() => ({ active: false, id: undefined }));

  if (!active) {
    if (id) {
      return {
        statusCode: 200,
        body: JSON.stringify({ sessionId: id }),
        headers: headers(event),
      };
    } else {
      return {
        statusCode: 500,
        body: "Failed to subscribe to RoamJS Site service. Contact support@roamjs.com for help!",
        headers: headers(event),
      };
    }
  }

  await users.updateUser(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      [serviceCamelCase]: {},
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
};
