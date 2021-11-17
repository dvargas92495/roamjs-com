import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";
import { authenticate, headers, userError } from "../lambda-helpers";

const sts = new AWS.STS({ apiVersion: "2011-06-15" });

export const handler: APIGatewayProxyHandler = authenticate((event) => {
  const userId = event.headers.Authorization;
  const { path } = JSON.parse(event.body || "{}");
  return users
    .getUser(userId)
    .then(
      (u) =>
        (u.publicMetadata as { developer: { paths: string[] } })["developer"]
          .paths || []
    )
    .then((paths) =>
      paths.includes(path.replace(/^([^/]+)\/(.*)$/, '$1'))
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
                    Resource: [`arn:aws:s3:::roamjs.com/${path}/*`],
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
                distributionId: /\/(.*)$/.exec(process.env.CLOUDFRONT_ARN)?.[1],
              }),
              headers: headers(event),
            }))
        : userError(`User not authorized to publish to path ${path}`, event)
    );
}, "developer");
