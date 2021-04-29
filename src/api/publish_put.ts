import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { TreeNode, ViewType } from "roam-client";
import { authenticate, getGithubOpts, headers, s3 } from "../lambda-helpers";

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
  const extension = path.replace(/(\.js|\/)$/, "");
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
              Key: `markdown/${extension}.md`,
              Body: blocks.map((b) => blockToMarkdown(b, viewType, 0)).join(""),
            })
            .promise()
            .then((r) =>
              axios
                .post(
                  `https://api.github.com/repos/dvargas92495/roam-js-extensions/actions/workflows/isr.yaml/dispatches`,
                  { ref: "master", inputs: { extension } },
                  getGithubOpts(),
                )
                .then((gh) => ({
                  etag: r.ETag,
                  gh: gh.data,
                }))
                .catch((e) => ({
                  etag: r.ETag,
                  gh: e.response.data,
                }))
            )
            .then((r) => ({
              statusCode: 200,
              body: JSON.stringify(r),
              headers: headers(event),
            }))
    );
}, "developer");
