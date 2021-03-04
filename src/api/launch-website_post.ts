import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import { dynamo, getClerkUser, headers, lambda } from "../lambda-helpers";
import randomstring from "randomstring";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, domain, priceId } = JSON.parse(event.body);
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

  if (!priceId) {
    return {
      statusCode: 400,
      body: "Missing Product to subscribe to.",
      headers: headers(event),
    };
  }

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
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
          S: "SUBSCRIBING",
        },
      },
    })
    .promise();

  const callbackToken = randomstring.generate();
  const updatedUser = await users.updateUser(user.id, {
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
  const { active, id } = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-subscribe`,
      {
        priceId,
        successParams: { tab: "static_site" },
        metadata: {
          graph,
          domain,
          userId: user.id,
          callbackToken,
          url: `${process.env.API_URL}/finish-launch-website`,
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
          Origin: event.headers.Origin,
        },
      }
    )
    .then((r) => r.data)
    .catch((e) => {
      console.error(e.response?.data || e.message);
      return { active: false };
    });
  if (!active) {
    if (id) {
      await users.updateUser(user.id, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        privateMetadata: JSON.stringify({
          ...updatedUser.privateMetadata,
          websiteToken: callbackToken,
        }),
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ sessionId: id }),
        headers: headers(event),
      };
    } else {
      return {
        statusCode: 500,
        body: "Failed to subscribe to RoamJS Site service",
        headers: headers(event),
      };
    }
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
    headers: headers(event),
  };
};
