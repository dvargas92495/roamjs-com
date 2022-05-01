import { APIGatewayProxyHandler } from "aws-lambda";
import { s3, userError } from "../src/lambda-helpers";
import headers from "roamjs-components/backend/headers";
import emailCatch from "roamjs-components/backend/emailCatch";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, limit, page } = event.queryStringParameters || {};
  const limitValue = Number(limit) || 1;
  const pageValue = Number(page) || 0;
  if (limitValue < 1) {
    return userError("Limit must be greater than 0", event);
  }
  if (pageValue < 0) {
    return userError("Page must be greater than or equal to 0", event);
  }
  if (!id) {
    return userError("Must include extension to look up versions", event);
  }
  return s3
    .listObjectsV2({ Bucket: "roamjs.com", Prefix: `${id}/`, Delimiter: "/" })
    .promise()
    .then((r) => {
      const allVersions = r.CommonPrefixes.map((c) => c.Prefix)
        .filter((s) => /\d\d\d\d-\d\d-\d\d-\d\d-\d\d/.test(s))
        .reverse();
      return {
        versions: allVersions
          .slice(pageValue, pageValue + limitValue)
          .map((s) => s.replace(id, "").replace(/\//g, "")),
        isEnd: pageValue + limitValue >= allVersions.length,
      };
    })
    .then((res) => ({
      statusCode: 200,
      body: JSON.stringify(res),
      headers,
    }))
    .catch(emailCatch(`Failed to fetch versions for ${id}`));
};
