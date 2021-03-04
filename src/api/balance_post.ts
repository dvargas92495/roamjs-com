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
      headers: headers(event),
      body: "Unauthorized attempt to change user balance",
    };
  }

  const user = await users
    .getUserList()
    .then((l) =>
      l.find((u) => u.emailAddresses.some((e) => e.emailAddress === email))
    );
  const publicMetadata = JSON.stringify({
    balance: (
      (parseFloat((user.publicMetadata as { balance?: string }).balance) || 0) +
      quantity / 100
    ).toString(),
  });
  return users
    .updateUser(user.id, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
      publicMetadata,
    })
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: headers(event),
    }));
};
