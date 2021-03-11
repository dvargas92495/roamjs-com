import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import { getClerkUser, headers } from "../lambda-helpers";
import randomstring from "randomstring";

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
  const { service } = JSON.parse(event.body || "{}") as { service: string };
  const productName = `roamjs ${service.split("-").slice(-1)}`;
  const serviceCamelCase = service
    .split("-")
    .map((s, i) =>
      i == 0 ? s : `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
    )
    .join("");

  const priceId = await axios
    .get<{ products: { name: string; prices: { id: string }[] }[] }>(
      `${process.env.FLOSS_API_URL}/stripe-products?project=RoamJS`
    )
    .then(
      (r) =>
        r.data.products.find((p) => p.name.toLowerCase() === productName)
          ?.prices?.[0]?.id
    );

  const checkoutToken = v4();

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const { active, id } = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-subscribe`,
      {
        priceId,
        successPath: `services/${service}`,
        metadata: {
          service: serviceCamelCase,
          userId: user.id,
          callbackToken: checkoutToken,
          url: `${process.env.API_URL}/finish-start-service`,
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
          Origin: event.headers.Origin,
        },
      }
    )
    .then((r) => r.data)
    .catch((e) => {
      console.error(e.response?.data);
      return { active: false };
    });
  if (!active) {
    if (id) {
      const privateMetadata = JSON.stringify({
        ...user.privateMetadata,
        checkoutToken,
      });
      return users
        .updateUser(user.id, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
          privateMetadata,
        })
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ sessionId: id }),
          headers: headers(event),
        }));
    } else {
      return {
        statusCode: 500,
        body:
          "Failed to subscribe to RoamJS Site service. Contact support@roamjs.com for help!",
        headers: headers(event),
      };
    }
  }

  await users.updateUser(user.id, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
    publicMetadata: JSON.stringify({
      ...user.publicMetadata,
      [serviceCamelCase]: {
        token: randomstring.generate(),
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
};
