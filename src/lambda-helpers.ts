import {
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import axios from "axios";
import Cookies from "universal-cookie";
import { sessions, users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { User } from "@clerk/clerk-sdk-node/dist/resources/User";
import { v4 } from "uuid";
import AWS from "aws-sdk";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
export const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const wrapAxios = (
  req: AxiosPromise<Record<string, unknown>>
): Promise<APIGatewayProxyResult> =>
  req
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers,
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));

export const userError = (body: string): APIGatewayProxyResult => ({
  statusCode: 400,
  body,
  headers,
});

export const serverError = (body: string): APIGatewayProxyResult => ({
  statusCode: 500,
  body,
  headers,
});

// Github Creds
const personalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "";

export const getGithubOpts = (): AxiosRequestConfig => ({
  headers: {
    Accept: "application/vnd.github.inertia-preview+json",
    Authorization: `Basic ${Buffer.from(
      `dvargas92495:${personalAccessToken}`
    ).toString("base64")}`,
  },
});

// Twitter Creds
const twitterConsumerKey = process.env.TWITTER_CONSUMER_KEY || "";
const twitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET || "";

export const getTwitterOpts = async (): Promise<AxiosRequestConfig> => {
  const twitterBearerTokenResponse = await wrapAxios(
    axios.post(
      `https://api.twitter.com/oauth2/token`,
      {},
      {
        params: {
          grant_type: "client_credentials",
        },
        auth: {
          username: twitterConsumerKey,
          password: twitterConsumerSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }
    )
  );

  const body = JSON.parse(twitterBearerTokenResponse.body);
  const twitterBearerToken = body.access_token;

  return {
    headers: {
      Authorization: `Bearer ${twitterBearerToken}`,
    },
  };
};

export type Contracts = { link: string; reward: number }[];

export const getFlossActiveContracts = (): Promise<{
  projects: Contracts;
  issues: Contracts;
}> =>
  axios
    .get(`${process.env.FLOSS_API_URL}/contracts`)
    .then(
      (r: AxiosResponse<{ projects: Contracts; issues: Contracts }>) => r.data
    );

export const twitterOAuth = new OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY || "",
    secret: process.env.TWITTER_CONSUMER_SECRET || "",
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

export const getClerkUser = async (
  event: APIGatewayProxyEvent
): Promise<User> => {
  const cookies = new Cookies(event.headers.Cookie);
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

export const getClerkOpts = (email: string): AxiosRequestConfig => ({
  headers: {
    Authorization: `Basic ${Buffer.from(email).toString("base64")}`,
  },
});

export const flossGet = ({
  event,
  path,
}: {
  event: APIGatewayProxyEvent;
  path: string;
}): Promise<APIGatewayProxyResult> =>
  getClerkEmail(event).then((email) =>
    email
      ? axios
          .get(`${process.env.FLOSS_API_URL}/${path}`, getClerkOpts(email))
          .then((r) => ({
            statusCode: 200,
            body: JSON.stringify(r.data),
            headers,
          }))
      : Promise.resolve({
          statusCode: 401,
          body: "No Active Session",
          headers,
        })
  );

export const launchWebsite = async ({
  userId,
  email,
  graph,
  domain,
}: {
  userId: string;
  email: string;
  graph: string;
  domain: string;
}): Promise<APIGatewayProxyResult> => {
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
          S: "INITIALIZING",
        },
      },
    })
    .promise();

  await dynamo
    .updateItem({
      TableName: "RoamJSClerkUsers",
      Key: { id: { S: userId } },
      ExpressionAttributeNames: {
        "#WT": "website_token",
      },
      UpdateExpression: "REMOVE #WT",
    })
    .promise();

  await lambda
    .invoke({
      FunctionName: "RoamJS_launch",
      InvocationType: "Event",
      Payload: JSON.stringify({
        roamGraph: graph,
        domain,
        email,
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ graph, domain }),
    headers,
  };
};
