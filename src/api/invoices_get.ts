import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import format from "date-fns/format";
import { getClerkUser, headers, stripe } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then(async (user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active User Session",
        headers: headers(event),
      };
    }
    const params = Object.fromEntries(
      Object.entries(event.queryStringParameters).filter(([k]) =>
        ["starting_after", "ending_before"].includes(k)
      )
    );
    const customer = user.privateMetadata?.stripeId as string;
    return stripe.invoices
      .list({
        customer,
        limit: 5,
        ...params,
      })
      .then(({ data, has_more }) => ({
        statusCode: 200,
        body: JSON.stringify({
          invoices: data.map((i) => ({
            id: i.id,
            name: i.number,
            date: format(new Date(i.created * 1000), "yyyy/MM/dd"),
            total: i.total / 100,
            pdf: i.invoice_pdf,
          })),
          hasMore: has_more,
        }),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.message,
        headers: headers(event),
      }));
  });
