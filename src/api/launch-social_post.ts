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

  const priceId = await axios
    .get<{ products: { name: string; prices: { id: string }[] }[] }>(
      `${process.env.FLOSS_API_URL}/stripe-products?project=RoamJS`
    )
    .then((r) => {
      console.log(r.data);
      return r;
    })
    .then(
      (r) =>
        r.data.products.find((p) => p.name === "RoamJS Social")?.prices?.[0]?.id
    );

  const checkoutToken = v4();
  const privateMetadata = JSON.stringify({
    ...user.privateMetadata,
    checkoutToken,
  });
  await users.updateUser(user.id, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
    privateMetadata,
  });

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const { active, id } = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-subscribe`,
      {
        priceId,
        successParams: { tab: "social" },
        metadata: {
          userId: user.id,
          callbackToken: checkoutToken,
          url: `${process.env.API_URL}/finish-launch-social`,
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
      return {
        statusCode: 200,
        body: JSON.stringify({ sessionId: id }),
        headers: headers(event),
      };
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
    privateMetadata: JSON.stringify({
      ...user.privateMetadata,
      socialToken: randomstring.generate(),
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
};
