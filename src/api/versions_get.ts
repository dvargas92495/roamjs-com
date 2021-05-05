import { APIGatewayProxyHandler } from "aws-lambda";
import { emailCatch, headers, s3, userError } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, limit } = event.queryStringParameters || {};
  const limitValue = Number(limit) || 1;
  if (limitValue < 1) {
    return userError("Limit must be greater than 0", event);
  }
  if (!id) {
    return userError("Must include extension to look up versions", event);
  }
  return s3
    .listObjectsV2({ Bucket: "roamjs.com", Prefix: `${id}/`, Delimiter: "/" })
    .promise()
    .then((r) =>
      r.CommonPrefixes.map((c) => c.Prefix)
        .filter(s => /\d\d\d\d-\d\d-\d\d-\d\d-\d\d/.test(s))
        .slice(-limitValue)
        .map((s) => s.replace(id, "").replace(/\//g, ''))
    )
    .then((versions) => ({
      statusCode: 200,
      body: JSON.stringify({ versions }),
      headers: headers(event),
    }))
    .catch(emailCatch(`Failed to fetch versions for ${id}`, event));
};
