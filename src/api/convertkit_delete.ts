import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { emptyResponse, getClerkEmail } from "../lambda-helpers";

const ckApiSecret = process.env.CONVERTKIT_API_TOKEN;

export const handler: APIGatewayProxyHandler = (event) =>
  getClerkEmail(event).then((email) =>
    axios
      .put("https://api.convertkit.com/v3/unsubscribe", {
        api_secret: ckApiSecret,
        email,
      })
      .then(() => emptyResponse(event))
  );
