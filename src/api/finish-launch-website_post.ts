import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import { dynamo, headers, lambda } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, domain, userId, callbackToken } = JSON.parse(event.body);
  if (!graph) {
    return {
      statusCode: 400,
      body: "Roam Graph is required",
      headers,
    };
  }

  if (!domain) {
    return {
      statusCode: 400,
      body: "Target Domain is required",
      headers,
    };
  }

  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
      headers,
    };
  }

  const user = await users.getUser(userId);
  const { websiteToken, ...rest } = user.privateMetadata as {
    websiteToken: string;
  };
  if (!websiteToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a website launch.",
      headers,
    };
  }
  if (websiteToken !== callbackToken) {
    return {
      statusCode: 401,
      body: "Unauthorized call to finish website launch.",
      headers,
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
          S: "INITIALIZING",
        },
      },
    })
    .promise();

  await users.updateUser(user.id, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    privateMetadata: JSON.stringify(rest),
  });

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  ).emailAddress;
  await lambda
    .invoke({
      FunctionName: "RoamJS_launch",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        domain,
        email,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ graph, domain }),
    headers,
  };
};
