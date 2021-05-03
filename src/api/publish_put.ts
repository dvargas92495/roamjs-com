import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { TreeNode, ViewType } from "roam-client";
import {
  authenticate,
  emailCatch,
  getGithubOpts,
  headers,
  s3,
  userError,
} from "../lambda-helpers";

const viewTypeToPrefix = {
  bullet: "- ",
  document: "",
  numbered: "1. ",
};

const replaceComponents = (text: string): string =>
  text.replace(
    /{{(?:\[\[)?video(?:\]\])?:(?:\s)*https:\/\/www.loom.com\/share\/([0-9a-f]*)}}/,
    (_, id) => `<Loom id={"${id}"} />`
  );

const blockToMarkdown = (
  block: TreeNode,
  viewType: ViewType,
  depth: number
): string =>
  `${"".padStart(depth * 4, " ")}${viewTypeToPrefix[viewType]}${"".padStart(
    block.heading,
    "#"
  )}${block.heading > 0 ? " " : ""}${replaceComponents(block.text)}\n${
    viewType === "document" ? "\n" : ""
  }${block.children
    .map((v) => blockToMarkdown(v, block.viewType, depth + 1))
    .join("")}`;

export const handler: APIGatewayProxyHandler = authenticate(async (event) => {
  const userId = event.headers.Authorization;
  const {
    path,
    blocks,
    viewType,
    description,
    contributors,
    entry,
  } = JSON.parse(event.body || "{}") as {
    path: string;
    blocks: TreeNode[];
    viewType: ViewType;
    description: string;
    contributors: string[];
    entry: string;
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
  const extension = path.replace(/(\.js|\/)$/, "");
  const frontmatter = `---
description: "${description}"${
    contributors?.length ? `\ncontributors: ${contributors.join(", ")}` : ""
  }${entry ? `\nentry: ${entry}` : ""}
---

`;
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
              Body: `${frontmatter}${blocks
                .map((b) => blockToMarkdown(b, viewType, 0))
                .join("")}`,
            })
            .promise()
            .then((r) =>
              axios
                .post(
                  `https://api.github.com/repos/dvargas92495/roam-js-extensions/actions/workflows/isr.yaml/dispatches`,
                  { ref: "master", inputs: { extension } },
                  getGithubOpts()
                )
                .then(() => ({
                  etag: r.ETag,
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
