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
  const {
    data: { website },
  } = await axios.get(
    `${process.env.FLOSS_API_URL}/auth-user-metadata?key=website`,
    {
      headers: { Authorization: event.headers.Authorization },
    }
  );

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `deploy_${website.graph}`,
        },
        date: {
          S: new Date().toJSON(),
        },
        status: {
          S: "STARTING DEPLOY",
        },
      },
    })
    .promise();

  await lambda
    .invoke({
      FunctionName: "RoamJS_deploy",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: website.graph,
        domain: website.domain,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers,
  };
};
