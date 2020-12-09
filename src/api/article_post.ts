import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Mixpanel from "mixpanel";
import { headers } from "../lambda-helpers";
import charset from "charset";
import iconv from "iconv-lite";

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

export const handler = async (event: APIGatewayEvent) => {
  mixpanel.track("Use Extension", {
    extensionId: "article",
    action: "Import",
  });
  const { url } = JSON.parse(event.body);
  return axios
    .get(url, {
      headers: { "Content-type": "text/html" },
      responseType: "arraybuffer",
    })
    .then((r) => {
      const enc = charset(r.headers) || "utf8";
      const data = iconv.decode(r.data, enc);
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          ...headers,
          "Content-Type": `application/json;charset=${enc}`,
        },
      };
    })
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
