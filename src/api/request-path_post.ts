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

    const { path } = JSON.parse(event.body || "{}") as { path?: string };
    if (!path) {
      return userError("Path is required", event);
    }

    if (!/(\/|\.js)$/.test(path)) {
      return userError("Invalid path: must either end in '/' or '.js'", event);
    }

    const available = s3
      .listObjectsV2({ Bucket: "roamjs.com", Prefix: path })
      .promise()
      .then((r) => !r.Contents.length);
    if (!available) {
      return userError("Requested path is not available", event);
    }

    if (path.endsWith("/")) {
      await s3
        .putObject({
          Bucket: "roamjs.com",
          Key: `${path}/index`,
          Body: "lock",
        })
        .promise();
    } else if (path.endsWith(".js")) {
      await s3.putObject({
        Bucket: "roamjs.com",
        Key: path,
        Body: "// lock",
      });
    }

    const id = user.id;
    const publicMetadata = user.publicMetadata as {
      developer: { paths?: string[] };
    };
    const paths = [...(publicMetadata.developer.paths || []), path];
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
