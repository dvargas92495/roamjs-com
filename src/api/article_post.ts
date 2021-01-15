import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios, { AxiosError } from "axios";
import Mixpanel from "mixpanel";
import { headers } from "../lambda-helpers";
import charset from "charset";

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  mixpanel.track("Use Extension", {
    extensionId: "article",
    action: "Import",
  });
  const { url } = JSON.parse(event.body);
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
          body: JSON.stringify(r.data),
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
  return fetch({ "Content-type": "text/html", "user-agent": "Mozilla/5.0" })
    .catch((e) =>
      e.response.status === 502
        ? fetch({ "Content-type": "text/html" })
        : handleError(e)
    )
    .catch(handleError);
};
