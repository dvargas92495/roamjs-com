import { users } from "@clerk/clerk-sdk-node";
import {
  authenticate,
  emailCatch,
  emptyResponse,
  headers,
  lambda,
} from "../lambda-helpers";

export const handler = authenticate(async (event) => {
  const userId = event.headers.Authorization;
  const graph = await users
    .getUser(userId)
    .then((r) => (r.privateMetadata as { websiteGraph: string }).websiteGraph);

  if (!graph) {
    return emptyResponse(event);
  }

  if (graph !== event.queryStringParameters.graph) {
    return {
      statusCode: 401,
      body:
        "You are not authorized to update the static site tied to this graph",
      headers: headers(event),
    };
  }

  return lambda
    .invoke({
      FunctionName: "RoamJS_describe",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        roamGraph: graph,
      }),
    })
    .promise()
    .then((c) => ({
      statusCode: 200,
      body: c.Payload as string,
      headers: headers(event),
    }))
    .catch(emailCatch("Failed Getting Website Variables", event));
}, "staticSite");
