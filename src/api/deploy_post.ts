import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { subdomain: inputSubdomain } = JSON.parse(event.body);
  if (!inputSubdomain) {
    return {
      statusCode: 400,
      body: JSON.stringify("Subdomain is required"),
      headers,
    };
  }

  const {
    data: { subdomain: existingSubdomain },
  } = await axios.get(`${process.env.FLOSS_API_URL}/auth-user-metadata`, {
    headers: { Authorization: event.headers.Authorization },
  });

  if (inputSubdomain !== existingSubdomain) {
    await axios.put(
      `${process.env.FLOSS_API_URL}/auth-user-metadata`,
      { subdomain: inputSubdomain },
      {
        headers: { Authorization: event.headers.Authorization },
      }
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ subdomain: inputSubdomain }),
    headers,
  };
};
