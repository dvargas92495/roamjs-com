import { authenticate, getUserFromEvent, headers } from "../lambda-helpers";

const normalize = (hdrs: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(hdrs).map(([k, v]) => [k.toLowerCase(), v])
  );

export const handler = authenticate(async (event) => {
  const hs = normalize(event.headers);
  const service = hs["x-roamjs-service"];
  const token = hs["x-roamjs-token"];
  const dev = !!hs["x-roamjs-dev"];
  const user = await getUserFromEvent(token, service, dev).catch(() => ({
    publicMetadata: {},
    emailAddresses: [],
    primaryEmailAddressId: "",
  }));
  const { token: storedToken, ...data } = (
    user.publicMetadata as {
      [s: string]: { token: string; authenticated: boolean };
    }
  )?.[service];
  delete data.authenticated;
  if (!storedToken || token !== storedToken) {
    return {
      statusCode: 401,
      body: "User is unauthorized to access your service",
      headers: headers(event),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      ...data,
      email: user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress,
    }),
    headers: headers(event),
  };
}, "developer");
