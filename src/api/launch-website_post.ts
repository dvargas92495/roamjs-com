import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import {
  dynamo,
  getClerkUser,
  headers,
  launchWebsite,
} from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, domain, priceId } = JSON.parse(event.body);
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

  if (!priceId) {
    return {
      statusCode: 400,
      body: "Missing Product to subscribe to.",
      headers,
    };
  }

  const user = await getClerkUser(event);
  if (!user) {
    return {
      statusCode: 401,
      body: "No Active Session",
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
          S: "SUBSCRIBING",
        },
      },
    })
    .promise();

  const callbackToken = v4();
  await dynamo
    .updateItem({
      TableName: "RoamJSClerkUsers",
      Key: { id: { S: user.id } },
      ExpressionAttributeNames: {
        "#WG": "website_graph",
        "#WD": "website_domain",
        "#WT": "website_token",
      },
      ExpressionAttributeValues: {
        ":g": {
          S: graph,
        },
        ":d": {
          S: domain,
        },
        ":t": {
          S: callbackToken,
        },
      },
      UpdateExpression: "SET #WG = :g, #WD = :d, #WT = :t",
    })
    .promise();

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
          email,
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
      console.error(e.response?.data);
      return { active: false };
    });
  if (!active) {
    if (id) {
      return {
        statusCode: 200,
        body: JSON.stringify({ sessionId: id }),
        headers,
      };
    } else {
      return {
        statusCode: 500,
        body: "Failed to subscribe to RoamJS Site service",
        headers,
      };
    }
  }

  return launchWebsite({ userId: user.id, email, domain, graph });
};
