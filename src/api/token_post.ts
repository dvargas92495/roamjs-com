import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateToken, getClerkUser, headers } from "../lambda-helpers";

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

    const id = user.id;
    const privateMetadata = user.privateMetadata as {
      [key: string]: Record<string, unknown>;
    };

    const { value, encrypted } = generateToken();
    return users
      .updateUser(id, {
        privateMetadata: {
          ...privateMetadata,
          token: encrypted,
        },
      })
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ token: value }),
        headers: headers(event),
      }));
  });
