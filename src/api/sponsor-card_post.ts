import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  headers,
  stripe,
  dynamo,
  TableName,
  emailError,
} from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const {
    value,
    isMonthly,
    source,
  }: {
    value: number;
    isMonthly: boolean;
    source: string;
  } = JSON.parse(event.body || "{}");

  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const product = await stripe.products
    .list()
    .then((ps) => ps.data.find((p) => p.name === "RoamJS Sponsor")?.id);
  if (!product) {
    return {
      statusCode: 400,
      body: `No product found with name "RoamJS Sponsor"`,
      headers: headers(event),
    };
  }

  const price = await stripe.prices
    .list({ product })
    .then((r) =>
      r.data.find(
        (p) =>
          (p.type === "recurring" && isMonthly) ||
          (p.type === "one_time" && !isMonthly)
      )
    );
  if (!price) {
    return {
      statusCode: 400,
      body: `No price found with product RoamJS Sponsor and isMonthly ${isMonthly}`,
      headers: headers(event),
    };
  }
  const user = await dynamo
    .getItem({
      TableName,
      Key: { id: { S: source } },
    })
    .promise()
    .then((r) => r.Item?.user?.S);
  const connectedAccount = user
    ? { email: "support@roamjs.com", stripeAccount: "" }
    : await users.getUser(user).then((u) => ({
        email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress,
        stripeAccount: u.privateMetadata?.stripeAccount as string,
      }));

  if (
    !connectedAccount.stripeAccount &&
    connectedAccount.email !== "support@roamjs.com"
  )
    await emailError(
      "User sponsored without Stripe Account",
      new Error(
        `User ${connectedAccount.email} would have been sponored $${value} ${
          isMonthly ? "monthly" : "once"
        } but didn't have Stripe setup. Let them know!`
      )
    );

  const multiple = price.transform_quantity?.divide_by || 1;
  return stripe.checkout.sessions
    .create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: value * multiple,
        },
      ],
      metadata: {
        skipCallback: "true",
        source,
      },
      success_url: `${origin}/checkout?thankyou=true`,
      cancel_url: `${origin}/contribute`,
      ...(isMonthly
        ? {
            mode: "subscription",
            ...(connectedAccount.stripeAccount
              ? {
                  subscription_data: {
                    application_fee_percent: 10,
                    transfer_data: {
                      destination: connectedAccount.stripeAccount,
                    },
                  },
                }
              : { subscription_data: { metadata: { project: "RoamJS" } } }),
          }
        : {
            mode: "payment",
            payment_intent_data: {
              setup_future_usage: "off_session",
              ...(connectedAccount.stripeAccount
                ? {
                    application_fee_amount: 30 + Math.ceil(value * 8),
                    transfer_data: {
                      destination: connectedAccount.stripeAccount,
                    },
                  }
                : {}),
            },
          }),
    })
    .then((session) => ({
      statusCode: 200,
      body: JSON.stringify({ id: session.id, active: false }),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.errorMessage || e.message,
      headers: headers(event),
    }));
};
