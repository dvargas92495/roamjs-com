import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkEmail, getClerkOpts, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkEmail(event).then((email) =>
    email
      ? axios
          .put(
            `${process.env.FLOSS_API_URL}/stripe-payment-method`,
            JSON.parse(event.body),
            getClerkOpts(email)
          )
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
