import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamo, headers, launchWebsite } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, domain, userId, email, callbackToken } = JSON.parse(
    event.body
  );
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

  if (!email) {
    return {
      statusCode: 400,
      body: "Email is required",
      headers,
    };
  }

  const storedToken = await dynamo
    .getItem({
      TableName: "RoamJSClerkUsers",
      Key: { id: { S: userId } },
    })
    .promise()
    .then((r) => r.Item?.website_token?.S);
  if (!storedToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a website launch.",
      headers,
    };
  }
  if (storedToken !== callbackToken) {
    return {
      statusCode: 401,
      body: "Unauthorized call to finish website launch.",
      headers,
    };
  }

  return launchWebsite({ userId, email, graph, domain });
};
