import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamo, headers, listAll, s3 } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = (event) => {
  const id = event.queryStringParameters?.id;
  const sub = event.queryStringParameters?.sub === "true";
  return id
    ? s3
        .getObject({ Bucket: "roamjs.com", Key: `markdown/${id}.md` })
        .promise()
        .then((c) =>
          dynamo
            .getItem({
              TableName: "RoamJSExtensions",
              Key: { id: { S: id } },
            })
            .promise()
            .then((r) => ({
              statusCode: 200,
              body: JSON.stringify({
                content: c.Body.toString(),
                state: r.Item.state.S,
                description: r.Item.description.S,
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
