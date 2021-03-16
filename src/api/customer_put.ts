import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) =>
    user
      ? axios
          .put(`${process.env.FLOSS_API_URL}/stripe-user`, {
            name: `${user.firstName} ${user.lastName}`,
            email: user.emailAddresses.find(
              (e) => e.id === user.primaryEmailAddressId
            ).emailAddress,
          })
          .then((r) => ({
            statusCode: 200,
            body: JSON.stringify(r.data),
            headers: headers(event),
          }))
      : Promise.resolve({
          statusCode: 401,
          body: "No Active Session",
          headers: headers(event),
        })
  );
