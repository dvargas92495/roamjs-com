import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import { TreeNode, ViewType } from "roam-client";
import { authenticate, headers, s3 } from "../lambda-helpers";

/* Invalidate when we have ISR
import AWS from "aws-sdk";

const cloudfront = new AWS.CloudFront({ apiVersion: "2020-05-31" });
cloudfront
            .createInvalidation({
              DistributionId: process.env.CLOUDFRONT_ARN.match(/:distribution\/(.*)$/)[1],
              InvalidationBatch: {
                CallerReference: new Date().toJSON(),
                Paths: {
                  Quantity: 1,
                  Items: [`/${}`],
                },
              },
            }).promise()
*/

const viewTypeToPrefix = {
  bullet: "- ",
  document: "",
  numbered: "1. ",
};

const blockToMarkdown = (
  block: TreeNode,
  viewType: ViewType,
  depth: number
): string =>
  `${"".padStart(depth * 4, " ")}${viewTypeToPrefix[viewType]}${"".padStart(
    block.heading,
    "#"
  )}${block.heading > 0 ? " " : ""}${block.text}\n${
    viewType === "document" ? "\n" : ""
  }${block.children
    .map((v) => blockToMarkdown(v, block.viewType, depth + 1))
    .join("")}`;

export const handler: APIGatewayProxyHandler = authenticate((event) => {
  const userId = event.headers.Authorization;
  const { path, blocks, viewType } = JSON.parse(event.body || "{}") as {
    path: string;
    blocks: TreeNode[];
    viewType: ViewType;
  };
  return users
    .getUser(userId)
    .then(
      (u) =>
        (u.publicMetadata as { developer: { paths: string[] } })["developer"]
          .paths || []
    )
    .then((paths) =>
      !paths.includes(path)
        ? {
            statusCode: 401,
            body: `User does not have access to path ${path}`,
          }
        : s3
            .upload({
              Bucket: "roamjs.com",
              Key: `markdown/${path.replace(/(\.js|\/)$/, "")}.md`,
              Body: blocks.map((b) => blockToMarkdown(b, viewType, 0)).join(""),
            })
            .promise()
            .then((r) => ({
              statusCode: 200,
              body: JSON.stringify({
                etag: r.ETag,
              }),
              headers: headers(event),
            }))
    );
}, "developer");
