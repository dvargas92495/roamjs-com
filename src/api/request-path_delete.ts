import { users } from "@clerk/clerk-sdk-node";
import {
  authenticate,
  headers,
  s3,
  serverError,
  userError,
} from "../lambda-helpers";

export const handler = authenticate(async (event) => {
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

  const id = event.headers.Authorization;
  const user = await users.getUser(id);
  const publicMetadata = user.publicMetadata as {
    developer: { paths?: string[] };
  };
  const paths = (publicMetadata.developer.paths || []).filter(
    (p) => p !== path
  );
  return users
    .updateUser(id, {
      publicMetadata: {
        ...publicMetadata,
        developer: {
          ...publicMetadata.developer,
          paths,
        },
      },
    })
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({ paths }),
      headers: headers(event),
    }))
    .catch((e) => serverError(e.message, event));
}, "developer");
