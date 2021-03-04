import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) =>
    user
      ? {
          statusCode: 200,
          body: JSON.stringify({
            token:
              (user.privateMetadata as { socialToken?: string })?.socialToken,
          }),
          headers: headers(event),
        }
      : {
          statusCode: 401,
          body: "No Active Session",
          headers: headers(event),
        }
  );
