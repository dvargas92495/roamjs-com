import { authenticate, headers } from "../lambda-helpers";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import { users } from "@clerk/clerk-sdk-node";
import randomstring from "randomstring";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = authenticate(async (event) => {
  const { graph } = JSON.parse(event.body || "{}");
  const user = await users.getUser(event.headers.Authorization);

  await dynamo
    .putItem({
      TableName: "RoamJSWebsiteStatuses",
      Item: {
        uuid: {
          S: v4(),
        },
        action_graph: {
          S: `launch_${graph}`,
        },
        date: {
          S: new Date().toJSON(),
        },
        status: {
          S: "SHUTTING DOWN",
        },
      },
    })
    .promise();

  const callbackToken = randomstring.generate();
  await users.updateUser(user.id, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore PR up to adress this
    privateMetadata: JSON.stringify({
      ...user.privateMetadata,
      websiteToken: callbackToken,
    }),
  });

  await lambda
    .invoke({
      FunctionName: "RoamJS_shutdown",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        shutdownCallback: {
          callbackToken,
          url: `${process.env.API_URL}/finish-shutdown-website`,
          userId: user.id,
        },
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
}, 'staticSite');
