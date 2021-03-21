import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import randomstring from "randomstring";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    if (!user) {
      return {
        statusCode: 401,
        body: "No Active Session",
        headers: headers(event),
      };
    }

    const { service } = JSON.parse(event.body);
    const id = user.id;
    const publicMetadata = user.publicMetadata as {
      [key: string]: Record<string, unknown>;
    };
    const token = randomstring.generate();
    return users
      .updateUser(id, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
        publicMetadata: JSON.stringify({
          ...publicMetadata,
          [service]: {
            ...publicMetadata[service],
            token,
          },
        }),
      })
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ token }),
        headers: headers(event),
      }));
  });
