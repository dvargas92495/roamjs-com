import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  bareSuccessResponse,
  emailCatch,
  getClerkUser,
  getExtensionUserId,
  getStripePriceId,
  headers,
  stripe,
} from "../lambda-helpers";
import sendEmail from "aws-sdk-plus/dist/sendEmail";

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
  const {
    service = "",
    extension = service,
    id,
  } = JSON.parse(event.body || "{}") as {
    service: string;
    extension: string;
    id: string;
  };
  if (!extension && !id) {
    return {
      statusCode: 400,
      body: "One of either `id` or `extension` is required.",
      headers: headers(event),
    };
  }
  const customer = user.privateMetadata.stripeId as string;
  const subscriptionItem = await (extension
    ? getStripePriceId(extension).then((priceId) =>
        stripe.subscriptions.list({ customer }).then((s) =>
          s.data
            .flatMap((ss) =>
              ss.items.data.map((si) => ({
                priceId: si.price.id,
                count: ss.items.data.length,
                id: si.id,
                subscriptionId: ss.id,
                extension,
              }))
            )
            .find(({ priceId: id }) => priceId === id)
        )
      )
    : stripe.subscriptionItems.retrieve(id).then((si) =>
        Promise.all([
          stripe.subscriptions.retrieve(si.subscription),
          stripe.prices.retrieve(si.price.id).then((s) => s.metadata.id || ""),
        ]).then(([ss, extension]) => ({
          priceId: si.price.id,
          count: ss.items.data.length,
          subscriptionId: ss.id,
          id: si.id,
          extension,
        }))
      ));
  if (!subscriptionItem) {
    return {
      statusCode: 409,
      body: `Current user is not subscribed to ${extension}`,
      headers: headers(event),
    };
  }

  const { success, message } = await (subscriptionItem.count > 1
    ? stripe.subscriptionItems.del(subscriptionItem.id)
    : stripe.subscriptions.del(subscriptionItem.subscriptionId)
  )
    .then(() => ({ success: true, message: "" }))
    .catch((r) => ({
      success: false,
      message: r.response.data || r.message,
    }));
  if (!success) {
    return {
      statusCode: 409,
      body: `Failed to cancel RoamJS subscription: ${message}`,
      headers: headers(event),
    };
  }

  const extensionCamelCase = subscriptionItem.extension
    .split("-")
    .map((s, i) =>
      i == 0 ? s : `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
    )
    .join("");

  const { [extensionCamelCase]: extensionField, ...rest } =
    user.publicMetadata as {
      [key: string]: string;
    };
  if (extensionField) {
    await users.updateUser(user.id, {
      publicMetadata: rest,
    });
  } else {
    console.warn("No metadata value to clear for field", extensionField);
  }

  const userEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const developer = await getExtensionUserId(subscriptionItem.extension);
  const developerEmail = await users
    .getUser(developer)
    .then(
      (u) =>
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress
    )
    .catch((e) =>
      emailCatch(
        `Failed to find developer ${developer} for extension ${subscriptionItem.extension}`,
        event
      )(e).then(() => "")
    );
  await sendEmail({
    to: developerEmail || "support@roamjs.com",
    from: "support@roamjs.com",
    subject: `User unsubscribed from extension from RoamJS`,
    body: `User ${userEmail} has unsubscribed from the ${subscriptionItem.extension} extension.`,
    replyTo: userEmail,
  });

  return bareSuccessResponse(event);
};
