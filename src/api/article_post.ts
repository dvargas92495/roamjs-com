import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Mixpanel from "mixpanel";
import { headers } from "../lambda-helpers";
import charset from "charset";

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

export const handler = async (event: APIGatewayEvent) => {
  mixpanel.track("Use Extension", {
    extensionId: "article",
    action: "Import",
  });
  const { url } = JSON.parse(event.body);
  return axios
    .get(url, { headers: { "Content-type": "text/html" } })
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: {
        ...headers,
        "Content-Type": `application/json;charset=${charset(r.headers)}`,
      },
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
