import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../lambda-helpers";
import FormData from "form-data";
import querystring from "querystring";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { key, secret, params } = JSON.parse(event.body || "{}");
  const isStatus = params.command === "STATUS";
  const url = `https://upload.twitter.com/1.1/media/upload.json${
    isStatus ? `?${querystring.stringify(params)}` : ""
  }`;
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize(
      {
        url,
        method: isStatus ? "GET" : "POST",
      },
      { key, secret }
    )
  );
  const formData = new FormData();
  Object.keys(params).forEach((k) => formData.append(k, params[k]));

  return (isStatus
    ? axios.get(url, { headers: oauthHeaders })
    : axios.post(url, formData, {
        headers: { ...oauthHeaders, ...formData.getHeaders() },
      })
  )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify({ message: e.message, url, ...e.response?.data }),
      headers: headers(event),
    }));
};
