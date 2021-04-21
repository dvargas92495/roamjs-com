import { users } from "@clerk/clerk-sdk-node";
import { authenticate, headers } from "../lambda-helpers";

export const handler = authenticate((event) => {
  const { service, key } = event.queryStringParameters;
  const userId = event.headers.Authorization;
  return users.getUser(userId).then((r) => ({
    statusCode: 200,
    body: JSON.stringify({
      value: (r.publicMetadata[service] as Record<string, unknown>)[key],
    }),
    headers: headers(event),
  }));
});
