import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { headers } from "../lambda-helpers";

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { userId, callbackToken } = JSON.parse(event.body);
  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
      headers,
    };
  }

  const {
    websiteToken,
    websiteGraph,
    websiteDomain,
    email,
    ...rest
  } = await users.getUser(userId).then(
    (r) =>
      ({
        ...r.privateMetadata,
        email: r.emailAddresses.find((e) => e.id === r.primaryEmailAddressId)
          .emailAddress,
      } as {
        websiteToken: string;
        websiteGraph: string;
        websiteDomain: string;
        email: string;
      })
  );
  if (!websiteToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a website shutdown.",
      headers,
    };
  }
  if (websiteToken !== callbackToken) {
    return {
      statusCode: 401,
      body: `Unauthorized call to finish website shutdown.`,
      headers,
    };
  }

  await users.updateUser(userId, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    privateMetadata: JSON.stringify(rest),
  });

  await ses
    .sendEmail({
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `Your static site is at ${websiteDomain} is no longer live. There are no sites connected to your graph ${websiteGraph}.`,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Your RoamJS site has successfully shutdown.`,
        },
      },
      Source: "support@roamjs.com",
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers,
  };
};
