import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { bareSuccessResponse, getClerkEmail } from "../lambda-helpers";

const ckApiSecret = process.env.CONVERTKIT_API_TOKEN;

export const handler: APIGatewayProxyHandler = (event) =>
  getClerkEmail(event).then((email) =>
    axios
      .post("https://api.convertkit.com/v3/forms/2239289/subscribe", {
        api_secret: ckApiSecret,
        email,
      })
      .then(() => bareSuccessResponse(event))
  );
