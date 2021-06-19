import { users } from "@clerk/clerk-sdk-node";
import { authenticate, headers } from "../lambda-helpers";

const normalize = (hdrs: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(hdrs).map(([k, v]) => [k.toLowerCase(), v])
  );

export const handler = authenticate(async (event) => {
  const hs = normalize(event.headers);
  const service = hs["x-roamjs-service"];
  const token = hs["x-roamjs-token"];
  const userId = Buffer.from(token, "base64").toString().split(":")[0];
  const user = await users
    .getUser(`user_${userId}`)
    .catch(() => ({ publicMetadata: {} }));
  const { token: storedToken, ...data } = (
    user.publicMetadata as { [s: string]: { token: string } }
  )?.[service];
  if (!storedToken || token !== storedToken) {
    return {
      statusCode: 401,
      body: "User is unauthorized to access your service",
      headers: headers(event),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: headers(event),
  };
}, "developer");
