import { users } from "@clerk/clerk-sdk-node";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type Stripe from "stripe";
import { headers, stripe } from "../lambda-helpers";

const normalizeHeaders = (hdrs: APIGatewayProxyEvent["headers"]) =>
  Object.fromEntries(
    Object.entries(hdrs).map(([h, v]) => [h.toLowerCase(), v])
  );

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { ["stripe-signature"]: sig } = normalizeHeaders(event.headers);
  const { body } = JSON.parse(event.body || "{}");
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig || "",
      process.env.STRIPE_CHECKOUT_SECRET || ""
    );
    const { userId, service = '', extension = service } = (
      stripeEvent.data.object as Stripe.Checkout.Session
    ).metadata as {
      service: string;
      extension: string;
      userId: string;
    };

    if (!userId) {
      return {
        statusCode: 400,
        body: "UserId is required",
        headers: headers(event),
      };
    }
    const { publicMetadata } = await users.getUser(userId);
    if ((publicMetadata[extension] as { token: string })?.token) {
      return {
        statusCode: 204,
        body: "",
        headers: headers(event),
      };
    }

    await users.updateUser(userId, {
      publicMetadata: {
        ...publicMetadata,
        [extension]: {},
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: headers(event),
    };
  } catch (err) {
    console.error(err);
    return Promise.resolve({
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    });
  }
};
