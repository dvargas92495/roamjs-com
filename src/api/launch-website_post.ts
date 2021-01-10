import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { graph, url } = JSON.parse(event.body);
  if (!graph) {
    return {
      statusCode: 400,
      body: JSON.stringify("Roam Graph is required"),
      headers,
    };
  }

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify("Target URL is required"),
      headers,
    }
  }

  const website = { graph, url, status: 'STARTING'};
  await axios.put(
    `${process.env.FLOSS_API_URL}/auth-user-metadata`,
    { website },
    {
      headers: { Authorization: event.headers.Authorization },
    }
  );

  await lambda.invokeAsync({
    FunctionName: 'roam-js-extensions_deploy',
    InvokeArgs: {
      roamGraph: graph,
    },
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(website),
    headers,
  };
};
