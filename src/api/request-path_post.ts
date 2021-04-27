import { users } from "@clerk/clerk-sdk-node";
import {
  authenticate,
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

  if (!/(\/|\.js)$/.test(path)) {
    return userError("Invalid path: must either end in '/' or '.js'", event);
  }

  const available = listAll(path).then((r) => !r.length);
  if (!available) {
    return userError("Requested path is not available", event);
  }

  if (path.endsWith("/")) {
    await s3
      .putObject({
        Bucket: "roamjs.com",
        Key: `${path}index`,
        Body: "lock",
      })
      .promise();
  } else if (path.endsWith(".js")) {
    await s3
      .putObject({
        Bucket: "roamjs.com",
        Key: path,
        Body: "// lock",
      })
      .promise();
  }

  const id = event.headers.Authorization;
  const user = await users.getUser(id);
  const publicMetadata = user.publicMetadata as {
    developer: { paths?: string[] };
  };
  const paths = [...(publicMetadata.developer.paths || []), path];
  await users.updateUser(id, {
    publicMetadata: {
      ...publicMetadata,
      developer: {
        ...publicMetadata.developer,
        paths,
      },
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ paths }),
    headers: headers(event),
  };
}, "developer");
