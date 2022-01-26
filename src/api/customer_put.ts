import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { users } from "@clerk/clerk-sdk-node";
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
    const name = `${user.firstName} ${user.lastName}`;
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    ).emailAddress;
    return stripe.customers
      .list({
        email,
      })
      .then((existingCustomers) =>
        existingCustomers.data.length
          ? Promise.resolve(existingCustomers.data[0])
          : stripe.customers.create({
              email,
              name,
            })
      )
      .then((stripeId) =>
        users.updateUser(user.id, {
          privateMetadata: { ...user.privateMetadata, stripeId },
        })
      )
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: headers(event),
      }));
  });
