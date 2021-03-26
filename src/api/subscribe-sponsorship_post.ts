import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkOpts, getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { sponsorship } = JSON.parse(event.body);
  if (!sponsorship) {
    return {
      statusCode: 400,
      body: "Missing sponsorship amount to subscribe to.",
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
  return axios
    .get<{
      products: {
        name: string;
        prices: { isMonthly: boolean; id: string }[];
      }[];
    }>(
      `${process.env.FLOSS_API_URL}/stripe-products?project=RoamJS`,
      getClerkOpts(email)
    )
    .then(
      (r) =>
        r.data.products
          .find((p: { name: string }) => p.name === "RoamJS Sponsor")
          .prices.find(({ isMonthly }) => isMonthly).id
    )
    .then((priceId) =>
      axios.post(
        `${process.env.FLOSS_API_URL}/stripe-subscribe`,
        {
          priceId,
          quantity: sponsorship * 125,
        },
        getClerkOpts(email)
      )
    )
    .then((r) => ({
      statusCode: r.status,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }));
};
