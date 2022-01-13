import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers, stripe } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then(async (user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active Session",
        headers: headers(event),
      };
    }
    const customer = user.privateMetadata?.stripeId as string;
    const { product = "" } = event.queryStringParameters || {};
    if (!product) {
      return {
        statusCode: 400,
        body: "Product query param is required",
        headers: headers(event),
      };
    }
    const subscriptions = await stripe.subscriptions.list({ customer });
    const products = await Promise.all(
      subscriptions.data
        .flatMap((s) =>
          s.items.data.map((i) => ({
            productId: i.price.product as string,
            id: s.id,
          }))
        )
        .map(({ productId, id }) =>
          stripe.products
            .retrieve(productId)
            .then((p) => ({ name: p.name, id }))
        )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        subscriptionId: products.find((p) => p.name === product)?.id,
      }),
      headers: headers(event),
    };
  });
