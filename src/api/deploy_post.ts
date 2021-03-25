import { authenticate, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import { users } from "@clerk/clerk-sdk-node";
import format from "date-fns/format";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

export const handler = authenticate(async (event) => {
  const { data } = JSON.parse(event.body);
  const user = await users.getUser(event.headers.Authorization);
  const { websiteGraph, websiteDomain } = user.privateMetadata as {
    websiteGraph: string;
    websiteDomain: string;
  };
  const date = new Date();

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `deploy_${websiteGraph}`,
        },
        date: {
          S: date.toJSON(),
        },
        status: {
          S: "STARTING DEPLOY",
        },
      },
    })
    .promise();

  const Key = data && `${websiteGraph}/${format(date, "yyyyMMddhhmmss")}`;
  if (Key) {
    await s3
      .upload({
        Bucket: "roamjs-static-site-data",
        Key,
        Body: data,
      })
      .promise();
  }
  
  await lambda
    .invoke({
      FunctionName: "RoamJS_deploy",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: websiteGraph,
        domain: websiteDomain,
        key: Key,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
}, 'staticSite');
