import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { getClerkEmail, headers } from "../lambda-helpers";

const ckApiSecret = process.env.CONVERTKIT_API_TOKEN;

export const handler: APIGatewayProxyHandler = (event) =>
  getClerkEmail(event).then((email) =>
    axios
      .get(
        `https://api.convertkit.com/v3/subscribers?api_secret=${ckApiSecret}&email_address=${email}`
      )
      .then((ck) => ({
        statusCode: 200,
        body: JSON.stringify({ isSubscribed: ck.data.total_subscribers > 0 }),
        headers: headers(event),
      }))
  );
