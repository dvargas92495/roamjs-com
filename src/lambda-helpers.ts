import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { APIGatewayProxyResult } from "aws-lambda";

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
