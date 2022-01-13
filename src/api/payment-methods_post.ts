import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers, stripe } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active Session",
        headers: headers(event),
      };
    }
    const customer = user?.privateMetadata?.stripeId as string;
    const origin = event.headers.Origin || event.headers.origin;
    return stripe.checkout.sessions
      .create({
        customer,
        payment_method_types: ["card"],
        mode: "setup",
        metadata: {
          skipCallback: "true",
        },
        success_url: `${origin}/user`,
        cancel_url: `${origin}/user`,
      })
      .then((session) => ({
        statusCode: 200,
        body: JSON.stringify({ id: session.id, active: false }),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.errorMessage || e.message,
        headers: headers(event),
      }));
  });
