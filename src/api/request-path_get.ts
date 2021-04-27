import { APIGatewayProxyHandler } from "aws-lambda";
import { headers, listAll, s3 } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = (event) => {
  const id = event.queryStringParameters?.id;
  return id
    ? s3
        .getObject({ Bucket: "roamjs.com", Key: `markdown/${id}.md` })
        .promise()
        .then((c) => ({
          statusCode: 200,
          body: JSON.stringify({ content: c.Body.toString() }),
          headers: headers(event),
        }))
    : listAll("markdown/")
        .then((r) =>
          r.map((c) => c.Key.replace(/^markdown\//, "").replace(/\.md$/, ""))
        )
        .then((paths) => ({
          statusCode: 200,
          body: JSON.stringify({ paths }),
          headers: headers(event),
        }));
};
