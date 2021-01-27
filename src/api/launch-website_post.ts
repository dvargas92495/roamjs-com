import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";
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
  const available = await axios
    .get(`${process.env.FLOSS_API_URL}/aws-check-domain?domain=${domain}`)
    .then((r) => r.data.available);
  if (!available) {
    return {
      statusCode: 400,
      body: `${domain} is not available!`,
      headers,
    };
  }

  const Authorization = event.headers.Authorization;

  const subscriptionActive = await axios
    .post(
      `${process.env.FLOSS_API_URL}/stripe-subscribe`,
      { priceId },
      { headers: { Authorization } }
    )
    .then((r) => r.data.active);
  if (!subscriptionActive) {
    return {
      statusCode: 500,
      body: "Failed to subscribe to RoamJS Site service",
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

  const website = { graph, domain };
  await axios.put(
    `${process.env.FLOSS_API_URL}/auth-user-metadata`,
    { website },
    {
      headers: { Authorization },
    }
  );

  lambda
    .invoke({
      FunctionName: "RoamJS_launch",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        domain,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify(website),
    headers,
  };
};
