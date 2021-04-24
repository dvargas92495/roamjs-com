import { users } from "@clerk/clerk-sdk-node";
import { v4 } from "uuid";
import { authenticate, bareSuccessResponse, dynamo, headers, lambda } from "../lambda-helpers";

export const handler = authenticate(async (event) => {
  const { graph, diffs } = JSON.parse(event.body);
  if (!graph) {
    return {
      statusCode: 400,
      body: "Roam Graph is required",
      headers: headers(event),
    };
  }

  if (!diffs?.length) {
    return {
      statusCode: 400,
      body: "Must have at least one diff to update",
      headers: headers(event),
    };
  }

  const user = await users.getUser(event.headers.Authorization);
  const { websiteGraph } = user.privateMetadata as { websiteGraph: string };
  if (websiteGraph !== graph) {
    return {
      statusCode: 401,
      body: "User is unauthorized to update the site to this graph",
      headers: headers(event),
    };
  }

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `launch_${graph}`,
        },
        date: {
          S: new Date().toJSON(),
        },
        status: {
          S: "UPDATING",
        },
      },
    })
    .promise();

  await lambda
    .invoke({
      FunctionName: "RoamJS_update",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        diffs,
      }),
    })
    .promise();

  return bareSuccessResponse(event);
}, 'staticSite');
