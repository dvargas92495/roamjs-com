import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  bareSuccessResponse,
  getClerkUser,
  getStripePriceId,
  headers,
  stripe,
} from "../lambda-helpers";

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
  const { service = "", subscription } = JSON.parse(event.body || "{}") as {
    service: string;
    subscription: string;
  };
  const customer = user.privateMetadata.stripeId as string;
  const priceId = await getStripePriceId(service);
  const subscriptionId =
    subscription ||
    (await stripe.subscriptions
      .list({ customer })
      .then(
        (s) =>
          s.data
            .flatMap((ss) =>
              ss.items.data.map((si) => ({ priceId: si.price.id, id: ss.id }))
            )
            .find(({ priceId: id }) => priceId === id)?.id
      ));
  if (!subscriptionId) {
    return {
      statusCode: 409,
      body: `Current user is not subscribed to ${service}`,
      headers: headers(event),
    };
  }

  const { success, message } = await stripe.subscriptions
    .del(subscriptionId)
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

  const serviceCamelCase = service
    .split("-")
    .map((s, i) =>
      i == 0 ? s : `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
    )
    .join("");

  const { [serviceCamelCase]: serviceField, ...rest } = user.publicMetadata as {
    [key: string]: string;
  };
  if (serviceField) {
    await users.updateUser(user.id, {
      publicMetadata: rest,
    });
  } else {
    console.warn("No metadata value to clear for field", serviceField);
  }

  return bareSuccessResponse(event);
};
