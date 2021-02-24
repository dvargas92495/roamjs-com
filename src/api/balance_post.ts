import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { email, quantity, token } = JSON.parse(event.body || "{}");
  if (token !== process.env.FLOSS_TOKEN) {
    return {
      statusCode: 401,
      headers,
      body: "Unauthorized attempt to change user balance",
    };
  }

  const user = await users
    .getUserList()
    .then((l) =>
      l.find((u) => u.emailAddresses.some((e) => e.emailAddress === email))
    );
  return users
    .updateUser(user.id, {
      publicMetadata: {
        balance:
          parseInt((user.publicMetadata as { balance?: string }).balance) +
          quantity / 100,
      },
    })
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers,
    }));
};
