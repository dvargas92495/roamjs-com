import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { TreeNode, ViewType } from "roam-client";
import {
  authenticate,
  dynamo,
  emailCatch,
  getGithubOpts,
  headers,
  s3,
  userError,
} from "../lambda-helpers";

const Bucket = "roamjs.com";
const toDoubleDigit = (n: number) => n.toString().padStart(2, "0");
const viewTypeToPrefix = {
  bullet: "- ",
  document: "",
  numbered: "1. ",
};

export const handler: APIGatewayProxyHandler = authenticate(async (event) => {
  const userId = event.headers.Authorization;
  const {
    path,
    blocks,
    viewType,
    description,
    contributors,
    subpages,
    thumbnail,
  } = JSON.parse(event.body || "{}") as {
    path: string;
    blocks: TreeNode[];
    viewType: ViewType;
    description: string;
    contributors: string[];
    subpages: { [name: string]: { nodes: TreeNode[]; viewType: ViewType } };
    thumbnail?: string;
  };
  if (blocks.length === 0) {
    return userError(
      'Missing documentation content. Create a "Documentation" block on your extensions page and nest the content under it.',
      event
    );
  }
  if (!description) {
    return userError(
      'Missing extension description. Create a "Description" block on your extensions page and nest the extension description under it.',
      event
    );
  }
  if (description.length > 128) {
    return userError(
      "Description is too long. Please keep it 128 characters or fewer.",
      event
    );
  }
  const frontmatter = `---
description: "${description}"${
    contributors?.length ? `\ncontributors: "${contributors.join(", ")}"` : ""
  }
---

`;

  const today = new Date();
  const version = `${today.getFullYear()}-${toDoubleDigit(
    today.getMonth() + 1
  )}-${toDoubleDigit(today.getDate())}-${toDoubleDigit(
    today.getHours()
  )}-${toDoubleDigit(today.getMinutes())}`;
  await s3
    .upload({
      Bucket,
      Key: `markdown-version-cache/${path}/${version}.json`,
      Body: event.body,
      ContentType: "application/json",
    })
    .promise()
    .then(() =>
      dynamo
        .updateItem({
          TableName: "RoamJSExtensions",
          Key: {
            id: {
              S: path,
            },
          },
          UpdateExpression: "SET #d=:d",
          ExpressionAttributeNames: {
            "#d": "description",
          },
          ExpressionAttributeValues: {
            ":d": { S: description },
          },
        })
        .promise()
    );

  const replaceComponents = (text: string): string =>
    text
      .replace(
        /{{(?:\[\[)?video(?:\]\])?:(?:\s)*https:\/\/www.loom.com\/share\/([0-9a-f]*)}}/,
        (_, id) => `<Loom id={"${id}"} />`
      )
      .replace(
        /{{(?:\[\[)?youtube(?:\]\])?:(?:\s)*https:\/\/youtu.be\/([\w\d-]*)}}/,
        (_, id) => `<YouTube id={"${id}"} />`
      )
      .replace(
        new RegExp(`\\[(.*?)\\]\\(\\[\\[${path}/(.*?)\\]\\]\\)`),
        (_, label, page) => `[${label}](/extensions/${path}/${page})`
      );

  const blockToMarkdown = (block: TreeNode, viewType: ViewType): string =>
    `${viewTypeToPrefix[viewType]}${"".padStart(block.heading, "#")}${
      block.heading > 0 ? " " : ""
    }${replaceComponents(block.text)}\n${
      viewType === "document" ? "\n" : ""
    }${block.children.map((v) => blockToMarkdown(v, block.viewType)).join("")}`;

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
        : Promise.all([
            s3
              .upload({
                Bucket,
                Key: `markdown/${path}.md`,
                Body: `${frontmatter}${blocks
                  .map((b) => blockToMarkdown(b, viewType))
                  .join("")}`,
                ContentType: "text/markdown",
              })
              .promise(),
            ...Object.keys(subpages).map((p) =>
              s3
                .upload({
                  Bucket,
                  Key: `markdown/${path}/${p}.md`,
                  Body: subpages[p].nodes
                    .map((b) => blockToMarkdown(b, subpages[p].viewType))
                    .join(""),
                  ContentType: "text/markdown",
                })
                .promise()
            ),
            ...(thumbnail
              ? [
                  axios.get(thumbnail, {
                    responseType: 'stream'
                  }).then((r) =>
                    s3
                      .upload({
                        Bucket,
                        Key: `thumbnails/${path}.png`,
                        Body: r.data,
                        ContentType: "image/png",
                      })
                      .promise()
                  ),
                ]
              : []),
          ])
            .then((r) =>
              axios
                .post(
                  `https://api.github.com/repos/dvargas92495/roam-js-extensions/actions/workflows/isr.yaml/dispatches`,
                  { ref: "master", inputs: { extension: path } },
                  getGithubOpts()
                )
                .then(() => ({
                  etag: r[0].ETag,
                }))
            )
            .then((r) => ({
              statusCode: 200,
              body: JSON.stringify(r),
              headers: headers(event),
            }))
    )
    .catch(emailCatch(`Failed to publish documentation for ${path}.`, event));
}, "developer");
