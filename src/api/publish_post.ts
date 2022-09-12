import type { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";
import {
  authenticateDeveloper,
  headers,
  userError,
  dynamo,
  TableName,
} from "../lambda-helpers";

const sts = new AWS.STS({ apiVersion: "2011-06-15" });

export const handler: APIGatewayProxyHandler = authenticateDeveloper(
  (event) => {
    const userId = event.headers.Authorization;
    const { path } = JSON.parse(event.body || "{}");
    return dynamo
      .query({
        TableName,
        IndexName: "user-index",
        KeyConditionExpression: "#u = :u",
        ExpressionAttributeNames: { "#u": "user" },
        ExpressionAttributeValues: { ":u": { S: userId } },
      })
      .promise()
      .then((r) => r.Items.map((i) => i.id?.S))
      .then((paths) =>
        paths.includes(path.replace(/^([^/]+)\/(.*)$/, "$1"))
          ? sts
              .assumeRole({
                RoleArn: process.env.LAMBDA_ROLE,
                DurationSeconds: 900,
                RoleSessionName: `publish-${userId}`,
                Policy: JSON.stringify({
                  Version: "2012-10-17",
                  Statement: [
                    {
                      Sid: "PutPaths",
                      Effect: "Allow",
                      Action: "s3:PutObject",
                      Resource: [
                        `arn:aws:s3:::roamjs.com/${path}/*`,
                        `arn:aws:s3:::roamjs.com/downloads/${path}.zip`,
                      ],
                    },
                    {
                      Sid: "InvalidateCache",
                      Effect: "Allow",
                      Action: [
                        "cloudfront:CreateInvalidation",
                        "cloudfront:GetInvalidation",
                      ],
                      Resource: process.env.CLOUDFRONT_ARN,
                    },
                  ],
                }),
              })
              .promise()
              .then((creds) => ({
                statusCode: 200,
                body: JSON.stringify({
                  credentials: creds.Credentials,
                  distributionId: /\/(.*)$/.exec(
                    process.env.CLOUDFRONT_ARN
                  )?.[1],
                }),
                headers: headers(event),
              }))
          : userError(`User not authorized to publish to path ${path}`, event)
      );
  }
);
