import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkEmail, getClerkOpts, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkEmail(event).then((email) =>
    email
      ? axios
          .post(
            `${process.env.FLOSS_API_URL}/stripe-setup-intent`,
            JSON.parse(event.body),
            getClerkOpts(email, {
              Origin: event.headers.origin || event.headers.Origin,
            })
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
