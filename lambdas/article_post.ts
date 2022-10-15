import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios, { AxiosError } from "axios";
import headers from "roamjs-components/backend/headers";
import charset from "charset";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const { url } = JSON.parse(event.body || "{}");
  const fetch = (requestHeaders: { [key: string]: string }) =>
    axios
      .get(url, {
        headers: requestHeaders,
        responseType: "document",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore https://github.com/axios/axios/pull/2619
        responseEncoding: "base64",
      })
      .then((r) => {
        const enc = charset(r.headers) || "utf8";
        return {
          statusCode: 200,
          body: JSON.stringify({ encoded: r.data }),
          headers: {
            ...headers,
            "Content-Type": `application/json;charset=${enc}`,
          },
        };
      });
  const handleError = (e: Error & AxiosError) => ({
    statusCode: e.response?.status || 500,
    body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
    headers,
  });
  const mostHeaders = {
    "Content-type": "text/html",
    accept: "*/*",
    pragma: "no-cache",
  };
  return fetch({
    "user-agent": "Mozilla/5.0",
    ...mostHeaders,
  })
    .catch((e) =>
      [406, 502].includes(e.response.status)
        ? fetch(mostHeaders)
        : handleError(e)
    )
    .catch(handleError);
};
