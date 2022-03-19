import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import {
  dynamo,
  emailError,
  getClerkUser,
  headers,
  stripe,
  TableName,
} from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { value, isMonthly, source } = JSON.parse(event.body);
  if (!value) {
    return {
      statusCode: 400,
      body: "Missing sponsorship amount.",
      headers: headers(event),
    };
  }

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers: headers(event),
    };
  }
  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const customer = user.privateMetadata.stripeId as string;
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!customer) {
    return {
      statusCode: 401,
      body: `No Stripe Customer Found with ${email}`,
      headers: headers(event),
    };
  }
  const paymentMethod = await stripe.customers
    .retrieve(customer)
    .then((c) => c as Stripe.Customer)
    .then((c) => c.invoice_settings?.default_payment_method as string);
  const owner = await dynamo
    .getItem({
      TableName,
      Key: { id: { S: source } },
    })
    .promise()
    .then((r) => r.Item?.user?.S);
  const connectedAccount = user
    ? { email: "support@roamjs.com", stripeAccount: "" }
    : await users.getUser(owner).then((u) => ({
        email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress,
        stripeAccount: u.privateMetadata?.stripeAccount as string,
      }));
  const isConnected =
    connectedAccount.stripeAccount &&
    connectedAccount.email !== "support@roamjs.com";
  if (isConnected)
    await emailError(
      "User sponsored without Stripe Account",
      new Error(
        `User ${connectedAccount.email} would have been sponored $${value} ${
          isMonthly ? "monthly" : "once"
        } but didn't have Stripe setup. Let them know!`
      )
    );
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

  if (isMonthly) {
    const roamjsSubscription = await stripe.subscriptions
      .list({ customer })
      .then((all) => all.data.find((s) => s.metadata.project === "RoamJS"));
    if (roamjsSubscription && !isConnected) {
      return stripe.subscriptionItems
        .create({
          subscription: roamjsSubscription.id,
          price: price.id,
          quantity: value * 125,
        })
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ active: true, id: roamjsSubscription.id }),
          headers: headers(event),
        }));
    }
    return paymentMethod
      ? stripe.subscriptions
          .create({
            customer,
            items: [{ price: price.id, quantity: value * 125 }],
            ...(connectedAccount.stripeAccount
              ? {
                  application_fee_percent: 10,
                  transfer_data: {
                    destination: connectedAccount.stripeAccount,
                  },
                  metadata: { source },
                }
              : { metadata: { project: "RoamJS", source } }),
          })
          .then((s) => ({
            statusCode: 200,
            body: JSON.stringify({ active: true, id: s.id }),
            headers: headers(event),
          }))
          .catch((e) => ({
            statusCode: 500,
            body: `Failed to create subscription: ${
              e.errorMessage || e.message
            }`,
            headers: headers(event),
          }))
      : stripe.checkout.sessions
          .create({
            customer,
            payment_method_types: ["card"],
            line_items: [
              {
                price: price.id,
                quantity: value * 125,
              },
            ],
            mode: "subscription",
            success_url: `${origin}/checkout?thankyou=true`,
            cancel_url: `${origin}/contribute`,
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
          })
          .then((session) => ({
            statusCode: 200,
            body: JSON.stringify({ id: session.id, active: false }),
            headers: headers(event),
          }))
          .catch((e) => ({
            statusCode: 500,
            body: `Failed to create session ${e.errorMessage || e.message}`,
            headers: headers(event),
          }));
  }

  return paymentMethod
    ? stripe.paymentIntents
        .create({
          customer,
          amount: value * 100,
          payment_method: paymentMethod,
          currency: "usd",
          metadata: { source, skipCallback: "true" },
          ...(connectedAccount.stripeAccount
            ? {
                application_fee_amount: 30 + Math.ceil(value * 8),
                transfer_data: {
                  destination: connectedAccount.stripeAccount,
                },
              }
            : {}),
        })
        .then((p) => stripe.paymentIntents.confirm(p.id))
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({
            active: true,
          }),
          headers: headers(event),
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers: headers(event),
        }))
    : stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
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
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: value * 100,
                product_data: {
                  name: "RoamJS Sponsor",
                },
              },
              quantity: 1,
            },
          ],
          metadata: { source, skipCallback: "true" },
          success_url: `${origin}/checkout?thankyou=true`,
          cancel_url: `${origin}/contribute`,
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
