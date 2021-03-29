import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClerkUser, headers, s3, userError } from "../lambda-helpers";

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

    const { path } = event.queryStringParameters as { path?: string };
    if (!path) {
      return userError("Path is required", event);
    }
    const Objects = await s3
      .listObjectsV2({ Bucket: "roamjs.com", Prefix: path })
      .promise()
      .then((r) => r.Contents.map((c) => ({ Key: c.Key })));
    if (Objects.length === 0) {
      return userError("Requested path is not being used", event);
    }

    await s3
      .deleteObjects({ Bucket: "roamjs.com", Delete: { Objects } })
      .promise();

    const id = user.id;
    const publicMetadata = user.publicMetadata as {
      developer: { paths?: string[] };
    };
    const paths = (publicMetadata.developer.paths || []).filter(
      (p) => p !== path
    );
    return users
      .updateUser(id, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
        publicMetadata: JSON.stringify({
          ...publicMetadata,
          developer: {
            ...publicMetadata.developer,
            paths,
          },
        }),
      })
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ paths }),
        headers: headers(event),
      }));
  });
