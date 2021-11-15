import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamo, headers, listAll, s3, stripe } from "../lambda-helpers";

const DEFAULT_AUTHOR = {
  name: "RoamJS",
  email: "support@roamjs.com",
};

export const handler: APIGatewayProxyHandler = (event) => {
  const id = event.queryStringParameters?.id;
  const sub = event.queryStringParameters?.sub === "true";
  return id
    ? dynamo
        .getItem({
          TableName: "RoamJSExtensions",
          Key: { id: { S: id.split("/")[0] } },
        })
        .promise()
        .then((r) =>
          Promise.all([
            r.Item?.state?.S === "LEGACY"
              ? Promise.resolve("FILE")
              : s3
                  .getObject({ Bucket: "roamjs.com", Key: `markdown/${id}.md` })
                  .promise()
                  .then((c) => c.Body.toString()),
            r.Item.author?.S
              ? Promise.resolve({
                  name: "Query clerk",
                  email: "For the author",
                })
              : Promise.resolve(DEFAULT_AUTHOR),
            r.Item.premium?.S
              ? stripe.prices
                  .retrieve(r.Item.premium?.S)
                  .then(({ product, unit_amount }) =>
                    stripe.products
                      .retrieve(product as string)
                      .then(({ description }) => ({
                        description,
                        price: unit_amount / 100,
                      }))
                  )
              : Promise.resolve(undefined),
          ]).then(([content, author, premium]) => ({
            statusCode: 200,
            body: JSON.stringify({
              content,
              state: r.Item.state.S,
              description: r.Item.description.S,
              premium,
              author,
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
          TableName: "RoamJSExtensions",
        })
        .promise()
        .then((r) => ({
          statusCode: 200,
          body: JSON.stringify({
            paths: r.Items.map((c) => ({
              id: c.id?.S,
              description: c.description?.S,
              state: c.state?.S,
            })),
          }),
          headers: headers(event),
        }));
};
