import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";
import { authenticate, headers } from "../lambda-helpers";

const sts = new AWS.STS({ apiVersion: "2011-06-15" });

export const handler: APIGatewayProxyHandler = authenticate((event) => {
  const { path } = JSON.parse(event.body || "{}");
  return sts
    .assumeRole({
      RoleArn: process.env.LAMBDA_ROLE,
      DurationSeconds: 900,
      RoleSessionName: `publish-${path}`,
    })
    .promise()
    .then((creds) => ({
      statusCode: 200,
      body: JSON.stringify({ credentials: creds.Credentials }),
      headers: headers(event),
    }));
}, 'developer');
