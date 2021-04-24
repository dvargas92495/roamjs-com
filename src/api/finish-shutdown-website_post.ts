import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { headers } from "../lambda-helpers";

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { userId, callbackToken, domain } = JSON.parse(event.body);
  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
      headers: headers(event),
    };
  }

  const { websiteToken, websiteGraph, email, ...rest } = await users
    .getUser(userId)
    .then(
      (r) =>
        ({
          ...r.privateMetadata,
          email: r.emailAddresses.find((e) => e.id === r.primaryEmailAddressId)
            .emailAddress,
        } as {
          email: string;
        } & Record<string, unknown>)
    );
  if (!websiteToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a website shutdown.",
      headers: headers(event),
    };
  }
  if (websiteToken !== callbackToken) {
    return {
      statusCode: 401,
      body: `Unauthorized call to finish website shutdown.`,
      headers: headers(event),
    };
  }

  await users.updateUser(userId, {
    privateMetadata: rest,
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
            Data: `Your static site is at ${domain} is no longer live. There are no sites connected to your graph ${websiteGraph}.`,
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
    headers: headers(event),
  };
};
