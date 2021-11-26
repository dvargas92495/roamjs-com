import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers } from "../lambda-helpers";
import AES from "crypto-js/aes";
import encutf8 from "crypto-js/enc-utf8";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: AES.decrypt(
          (user.privateMetadata.token as string) || "",
          encryptionSecret
        ).toString(encutf8),
      }),
      headers: headers(event),
    };
  });
