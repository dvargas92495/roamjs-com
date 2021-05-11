import { users } from "@clerk/clerk-sdk-node";
import {
  authenticate,
  dynamo,
  headers,
  listAll,
  s3,
  userError,
} from "../lambda-helpers";

export const handler = authenticate(async (event) => {
  const { path } = JSON.parse(event.body || "{}") as { path?: string };
  if (!path) {
    return userError("Path is required", event);
  }

  if (!/^[a-z][a-z0-9-]*$/.test(path)) {
    return userError(
      "Invalid path: must consist of only lowercase letters, numbers, and dashes, starting with a letter",
      event
    );
  }

  const available = listAll(path).then(
    (r) => !r.objects.length && !r.prefixes.length
  );
  if (!available) {
    return userError("Requested path is not available", event);
  }

  await s3
    .putObject({
      Bucket: "roamjs.com",
      Key: `${path}/index`,
      Body: "lock",
    })
    .promise();

  const id = event.headers.Authorization;
  const user = await users.getUser(id);
  const publicMetadata = user.publicMetadata as {
    developer: { paths?: string[] };
  };
  const paths = [...(publicMetadata.developer.paths || []), path];
  await users
    .updateUser(id, {
      publicMetadata: {
        ...publicMetadata,
        developer: {
          ...publicMetadata.developer,
          paths,
        },
      },
    })
    .then(() =>
      dynamo
        .putItem({
          TableName: "RoamJSExtensions",
          Item: {
            id: {
              S: path,
            },
            description: {
              S: "",
            },
            state: {
              S: "DEVELOPMENT",
            },
          },
        })
        .promise()
    );
  return {
    statusCode: 200,
    body: JSON.stringify({ paths }),
    headers: headers(event),
  };
}, "developer");
