import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkUser, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

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

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  const { active, id } = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-subscribe`,
      { priceId, successParams: { callback: "launch-website", graph, domain } },
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

  const website = { graph, domain };
  await dynamo.updateItem({
    TableName: "RoamJSClerkUsers",
    Key: { id: { S: user.id } },
    ExpressionAttributeNames: {
      "#WG": "website_graph",
      "#WD": "website_domain",
    },
    ExpressionAttributeValues: {
      ":g": {
        S: graph,
      },
      ":d": {
        S: domain,
      },
    },
    UpdateExpression: "SET #WG = :g, #WD = :d",
  });

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
    body: JSON.stringify(website),
    headers,
  };
};
