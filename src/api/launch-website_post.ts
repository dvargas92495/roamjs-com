import { users } from "@clerk/clerk-sdk-node";
import { v4 } from "uuid";
import { authenticate, dynamo, headers, lambda } from "../lambda-helpers";

export const handler = authenticate(async (event) => {
  const { graph, domain, autoDeploysEnabled } = JSON.parse(event.body);
  if (!graph) {
    return {
      statusCode: 400,
      body: "Roam Graph is required",
      headers: headers(event),
    };
  }

  if (!domain) {
    return {
      statusCode: 400,
      body: "Target Domain is required",
      headers: headers(event),
    };
  }

  const user = await users.getUser(event.headers.Authorization);
  await users.updateUser(user.id, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    privateMetadata: JSON.stringify({
      ...user.privateMetadata,
      websiteGraph: graph,
      websiteDomain: domain,
    }),
  });

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

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
          S: "INITIALIZING",
        },
      },
    })
    .promise();

  await lambda
    .invoke({
      FunctionName: "RoamJS_launch",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        domain,
        email,
        autoDeploysEnabled,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ graph, domain }),
    headers: headers(event),
  };
});
