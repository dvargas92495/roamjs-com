import { APIGatewayProxyHandler } from "aws-lambda";
import {
  dynamo,
  headers,
  listAll,
  s3,
  stripe,
  TableName,
} from "../lambda-helpers";
import { users } from "@clerk/clerk-sdk-node";
import axios from "axios";

const DEFAULT_AUTHOR = {
  name: "RoamJS",
  email: "support@roamjs.com",
};

const userCache: Record<string, Promise<{ name: string; email: string }>> = {};
const getUser = (s?: string) =>
  s
    ? userCache[s] ||
      (userCache[s] = users.getUser(s).then((u) => ({
        name:
          u.firstName && u.lastName
            ? `${u.firstName} ${u.lastName}`.trim()
            : u.firstName || "Anonymous",
        email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress,
      })))
    : Promise.resolve(DEFAULT_AUTHOR);

export const handler: APIGatewayProxyHandler = (event) => {
  const id = event.queryStringParameters?.id;
  const sub = event.queryStringParameters?.sub === "true";
  return id
    ? dynamo
        .getItem({
          TableName,
          Key: { id: { S: id.split("/")[0] } },
        })
        .promise()
        .then((r) =>
          Promise.all([
            s3
              .getObject({ Bucket: "roamjs.com", Key: `markdown/${id}.md` })
              .promise()
              .then((c) => c.Body.toString())
              .then((c) =>
                c === "GITHUB"
                  ? axios
                      .get(
                        `${(r.Item.implementation?.S || "").replace(
                          /github\.com/,
                          "raw.githubusercontent.com"
                        )}/main/README.md`,
                        { responseType: "text" }
                      )
                      .then((r) => r.data)
                  : c
              )
              .catch(() => "FILE"),
            getUser(r.Item.user?.S),
            r.Item.premium?.S
              ? stripe.prices
                  .retrieve(r.Item.premium.S)
                  .then(
                    ({ product, unit_amount, recurring, transform_quantity }) =>
                      stripe.products
                        .retrieve(product as string)
                        .then(({ description }) => ({
                          description,
                          price: unit_amount / 100,
                          usage: recurring?.usage_type,
                          quantity: transform_quantity?.divide_by || 1,
                        }))
                  )
              : Promise.resolve(undefined),
          ]).then(([content, author, premium]) => ({
            statusCode: 200,
            body: JSON.stringify({
              content,
              state: r.Item.state?.S || "PRIVATE",
              description: r.Item.description?.S || "",
              premium,
              author,
              entry: r.Item.src?.S || "",
            }),
            headers: headers(event),
          }))
        )
    : sub
    ? listAll("markdown/")
        .then((r) =>
          Promise.all(
            r.prefixes.map((prefix) =>
              s3
                .listObjectsV2({
                  Bucket: "roamjs.com",
                  Prefix: prefix.Prefix,
                })
                .promise()
                .then((res) =>
                  res.Contents.map((id) => ({
                    subpage: id.Key.substring(prefix.Prefix.length)
                      .replace(/\.md$/, "")
                      .replace(/ /g, "_")
                      .toLowerCase(),
                    id: prefix.Prefix.replace(/markdown\//, "").replace(
                      /\/$/,
                      ""
                    ),
                  }))
                )
            )
          )
        )
        .then((paths) => paths.flatMap((subpaths) => subpaths))
        .then((paths) => ({
          statusCode: 200,
          body: JSON.stringify({ paths }),
          headers: headers(event),
        }))
    : dynamo
        .scan({
          TableName,
        })
        .promise()
        .then(async (r) => ({
          statusCode: 200,
          body: JSON.stringify({
            paths: await Promise.all(
              r.Items.map((c) =>
                getUser(c.user?.S).then((user) => ({
                  id: c.id?.S,
                  description: c.description?.S,
                  state: c.state?.S,
                  featured: Number(c.featured?.N || 0),
                  user,
                  entry: c.src?.S || "",
                }))
              )
            ),
          }),
          headers: headers(event),
        }));
};
