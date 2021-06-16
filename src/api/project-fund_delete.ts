import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { bareSuccessResponse, getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    const { uuid, contract } = event.queryStringParameters || {};
    const customer = user?.privateMetadata?.stripeId;
    const opts = {
      headers: {
        Authorization: `Bearer ${process.env.FLOSS_TOKEN}`,
      },
    };
    return (
      contract === "true"
        ? axios.delete(
            `${process.env.FLOSS_API_URL}/contract?uuid=${uuid}&customer=${customer}`,
            opts
          )
        : axios.delete(
            `${process.env.FLOSS_API_URL}/project-fund?uuid=${uuid}&customer=${customer}`,
            opts
          )
    )
      .then(() => bareSuccessResponse(event))
      .catch((e) => ({
        statusCode: e.response.status,
        body: e.response.data,
        headers: headers(event),
      }));
  });
