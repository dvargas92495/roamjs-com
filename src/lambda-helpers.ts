import { AxiosPromise, AxiosRequestConfig } from "axios";
import Cookies from "universal-cookie";
import { sessions, users, User } from "@clerk/clerk-sdk-node";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import AWS from "aws-sdk";
import randomstring from "randomstring";
import Stripe from "stripe";
import AES from "crypto-js/aes";
import encutf8 from "crypto-js/enc-utf8";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2020-08-27",
  maxNetworkRetries: 3,
});

export const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
export const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
export const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
export const ses = new AWS.SES({ apiVersion: "2010-12-01" });

const ALLOWED_ORIGINS = ["https://roamjs.com", "https://roamresearch.com"];
type Headers = {
  [header: string]: boolean | number | string;
};

export const headers = (
  event: Pick<APIGatewayProxyEvent, "headers">
): Headers => {
  const origin = event.headers.origin || event.headers.Origin;
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Credentials": true,
  };
};

export const wrapAxios = (
  req: AxiosPromise<Record<string, unknown>>,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  req
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers: headers(event),
    }));

export const userError = (
  body: string,
  event: APIGatewayProxyEvent
): APIGatewayProxyResult => ({
  statusCode: 400,
  body,
  headers: headers(event),
});

export const serverError = (
  body: string,
  event: Pick<APIGatewayProxyEvent, "headers">
): APIGatewayProxyResult => ({
  statusCode: 500,
  body,
  headers: headers(event),
});

export const emptyResponse = (
  event: APIGatewayProxyEvent
): APIGatewayProxyResult => ({
  statusCode: 204,
  body: JSON.stringify({}),
  headers: headers(event),
});

export const bareSuccessResponse = (
  event: Pick<APIGatewayProxyEvent, "headers">
): APIGatewayProxyResult => ({
  statusCode: 200,
  body: JSON.stringify({ success: true }),
  headers: headers(event),
});

export const getClerkUser = async (
  event: APIGatewayProxyEvent
): Promise<User> => {
  const cookies = new Cookies(event.headers.Cookie || event.headers.cookie);
  const sessionToken = cookies.get("__session");
  if (!sessionToken) {
    console.warn("No cookie found", JSON.stringify(event.headers, null, 4));
    return undefined;
  }
  const sessionId = event.queryStringParameters._clerk_session_id;
  const session = await sessions.verifySession(sessionId, sessionToken);
  return await users.getUser(session.userId);
};

export const getClerkEmail = async (
  event: APIGatewayProxyEvent
): Promise<string> => {
  const user = await getClerkUser(event);
  return user
    ? user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress
    : "";
};

export const getClerkOpts = (
  email: string,
  headers?: Record<string, string>
): AxiosRequestConfig => ({
  headers: {
    Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
    ...headers,
  },
});

export const generateToken = (): { encrypted: string; value: string } => {
  const value = randomstring.generate(16);
  return {
    encrypted: AES.encrypt(value, process.env.ENCRYPTION_SECRET).toString(),
    value,
  };
};

export const authenticateDeveloper =
  (handler: APIGatewayProxyHandler): APIGatewayProxyHandler =>
  (event, ctx, callback) => {
    const Authorization =
      event.headers.Authorization || event.headers.authorization || "";
    const encryptionSecret = process.env.ENCRYPTION_SECRET;
    const [email, token] = Buffer.from(
      Authorization.replace(/^Bearer /, ""),
      "base64"
    )
      .toString()
      .split(":");

    return users
      .getUserList({ emailAddress: [email] })
      .then((us) =>
        us.find((u) => {
          const stored = AES.decrypt(
            u.privateMetadata.token as string,
            encryptionSecret
          ).toString(encutf8);
          return stored && stored === token;
        })
      )
      .catch(() => undefined)
      .then((user) => {
        if (!user) {
          return {
            statusCode: 401,
            body: "Invalid Developer token",
            headers: headers(event),
          };
        }
        if (!user.publicMetadata["developer"]) {
          return {
            statusCode: 403,
            body: "User has not signed up for the RoamJS Developer extension",
            headers: headers(event),
          };
        }
        event.headers.Authorization = user.id;
        const result = handler(event, ctx, callback);
        if (!result) {
          return emptyResponse(event);
        }
        return result;
      });
  };

export const emailError = (subject: string, e: Error): Promise<string> =>
  ses
    .sendEmail({
      Destination: {
        ToAddresses: ["support@roamjs.com"],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `An error was thrown in a RoamJS lambda:

${e.name}: ${e.message}
${e.stack}`,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `RoamJS Error: ${subject}`,
        },
      },
      Source: "support@roamjs.com",
    })
    .promise()
    .then((r) => r.MessageId);

export const emailCatch =
  (subject: string, event: APIGatewayProxyEvent) =>
  (e: Error): Promise<APIGatewayProxyResult> =>
    emailError(subject, e).then((id) => ({
      statusCode: 500,
      body: `Unknown error - Message Id ${id}`,
      headers: headers(event),
    }));

export const listAll = async (
  Prefix: string
): Promise<{
  objects: AWS.S3.ObjectList;
  prefixes: AWS.S3.CommonPrefixList;
}> => {
  const objects: AWS.S3.ObjectList = [];
  const prefixes: AWS.S3.CommonPrefixList = [];
  let ContinuationToken: string = undefined;
  let isTruncated = true;
  while (isTruncated) {
    const res = await s3
      .listObjectsV2({
        Bucket: "roamjs.com",
        Prefix,
        ContinuationToken,
        Delimiter: "/",
      })
      .promise();
    objects.push(...res.Contents);
    prefixes.push(...res.CommonPrefixes);
    ContinuationToken = res.ContinuationToken;
    isTruncated = res.IsTruncated;
  }
  return { objects, prefixes };
};

export const TableName =
  process.env.NODE_ENV === "development"
    ? "RoamJSExtensions"
    : "RoamJSExtensions";

export const getStripePriceId = (extension: string): Promise<string> =>
  dynamo
    .getItem({
      TableName,
      Key: { id: { S: extension } },
    })
    .promise()
    .then((r) => r.Item.premium?.S);

export const getExtensionUserId = (extension: string): Promise<string> =>
  dynamo
    .getItem({
      TableName,
      Key: { id: { S: extension } },
    })
    .promise()
    .then((r) => r.Item.user?.S);
