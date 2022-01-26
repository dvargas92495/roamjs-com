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
    const subs = await stripe.subscriptions
      .list({
        customer,
      })
      .then((r) =>
        Promise.all(
          r.data.map((s) =>
            stripe.invoices
              .retrieveUpcoming({ subscription: s.id })
              .then((i) => ({
                invoiceAmountsByPrice: Object.fromEntries(
                  i.lines.data.map((l) => [l.price.id, l.amount])
                ),
                items: s.items,
                date: i.period_end * 1000,
              }))
          )
        )
      );
    const productIds = subs.flatMap((s) =>
      s.items.data.map((i) => i.price.product as string)
    );
    return stripe.products
      .list({ ids: productIds })
      .then((products) =>
        Object.fromEntries(
          products.data.map(({ id, name, description }) => [
            id,
            { name, description },
          ])
        )
      )
      .then((productMap) =>
        subs.flatMap((s) => {
          return s.items.data.map((i) => ({
            ...productMap[i.price.product as string],
            id: i.id,
            amount: s.invoiceAmountsByPrice[i.price.id] / 100,
            date: s.date,
          }));
        })
      )
      .then((subscriptions) => ({
        statusCode: 200,
        body: JSON.stringify({
          subscriptions,
        }),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.message,
        headers: headers(event),
      }));
  });
