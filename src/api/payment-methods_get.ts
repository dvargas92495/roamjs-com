import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkEmail, headers } from "../lambda-helpers";
import axios from "axios";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const email = await getClerkEmail(event);
  if (!email) {
    return {
      statusCode: 401,
      body: 'No Active Session',
      headers,
    }
  }
  const data = await axios.get(
    `${process.env.FLOSS_API_URL}/stripe-payment-methods`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
      },
    }
  );
  return {
    statusCode: 200,
    body: JSON.stringify(data.data),
    headers,
  };
};
