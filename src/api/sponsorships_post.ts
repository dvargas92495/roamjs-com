import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkOpts, getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { value, isMonthly, source } = JSON.parse(event.body);
  if (!value) {
    return {
      statusCode: 400,
      body: "Missing sponsorship amount.",
      headers: headers(event),
    };
  }

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
      headers: headers(event),
    };
  }

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const opts = {
    ...getClerkOpts(email),
    headers: {
      ...getClerkOpts(email).headers,
      origin: event.headers.Origin || event.headers.origin,
    },
  };
  const response = isMonthly
    ? axios
        .get<{
          products: {
            name: string;
            prices: { isMonthly: boolean; id: string }[];
          }[];
        }>(`${process.env.FLOSS_API_URL}/stripe-products?project=RoamJS`, opts)
        .then(
          (r) =>
            r.data.products
              .find((p: { name: string }) => p.name === "RoamJS Sponsor")
              .prices.find((p) => p.isMonthly).id
        )
        .then((priceId) =>
          axios.post(
            `${process.env.FLOSS_API_URL}/stripe-subscribe`,
            {
              priceId,
              quantity: value * 125,
              metadata: { source },
              cancelPath: "contribute",
              successPath: "checkout?thankyou=true",
            },
            opts
          )
        )
    : axios.post(
        `${process.env.FLOSS_API_URL}/stripe-payment-intent`,
        {
          name: "RoamJS Sponsor",
          value: value * 100,
          metadata: { source, skipCallback: "true" },
          cancelPath: "contribute",
          successPath: "checkout?thankyou=true",
        },
        opts
      );
  return response.then((r) => ({
    statusCode: r.status,
    body: JSON.stringify(r.data),
    headers: headers(event),
  }));
};
