import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateToken, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { userId, callbackToken, service } = JSON.parse(event.body) as {
    service: string;
    callbackToken: string;
    userId: string;
  };

  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
      headers: headers(event),
    };
  }

  const {
    privateMetadata: { checkoutToken, ...rest },
    publicMetadata,
  } = await users.getUser(userId);
  if (!checkoutToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a service start.",
      headers: headers(event),
    };
  }
  if (checkoutToken !== callbackToken) {
    return {
      statusCode: 401,
      body: "Unauthorized call to finish starting service.",
      headers: headers(event),
    };
  }

  await users.updateUser(userId, {
    privateMetadata: rest,
    publicMetadata: {
      ...publicMetadata,
      [service]: {
        token: generateToken(userId),
      },
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
};
