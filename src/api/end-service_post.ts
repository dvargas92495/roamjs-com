import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import {
  bareSuccessResponse,
  getClerkOpts,
  getClerkUser,
  headers,
  serverError,
} from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { service } = JSON.parse(event.body || "{}") as { service: string };

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers: headers(event),
    };
  }
  const name = service.split("-").slice(-1)[0];
  const productName = `RoamJS ${name
    .substring(0, 1)
    .toUpperCase()}${name.substring(1)}`;
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const { subscriptionId } = await axios
    .get(
      `${process.env.FLOSS_API_URL}/stripe-is-subscribed?product=${encodeURI(
        productName
      )}`,
      getClerkOpts(email)
    )
    .then((r) => r.data)
    .catch((e) => {
      console.error(e);
      return {};
    });
  if (!subscriptionId) {
    return serverError(
      `Current user is not subscribed to ${productName}`,
      event
    );
  }

  const opts = {
    headers: {
      Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
    },
  };
  const { success, message } = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-cancel`,
      {
        subscriptionId,
      },
      opts
    )
    .then((r) => ({ success: r.data.success, message: "" }))
    .catch((r) => ({ success: false, message: r.response.data || r.message }));
  if (!success) {
    return {
      statusCode: 500,
      body: `Failed to cancel RoamJS Site subscription: ${message}`,
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
      publicMetadata: JSON.stringify(rest),
    });
  }

  return bareSuccessResponse(event);
};
