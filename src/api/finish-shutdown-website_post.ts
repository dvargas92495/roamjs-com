import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamo, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { userId, callbackToken } = JSON.parse(event.body);
  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
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
      body: "User not awaiting a website shutdown.",
      headers,
    };
  }
  if (storedToken !== callbackToken) {
    return {
      statusCode: 401,
      body: "Unauthorized call to finish website shutdown.",
      headers,
    };
  }

  await dynamo
    .updateItem({
      TableName: "RoamJSClerkUsers",
      Key: { id: { S: userId } },
      ExpressionAttributeNames: {
        "#WT": "website_token",
        "#WG": "website_graph",
        "#WD": "website_domain",
      },
      UpdateExpression: "REMOVE #WT, #WG, #WD",
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers,
  };
};
