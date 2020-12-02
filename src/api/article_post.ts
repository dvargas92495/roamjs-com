import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import mixpanel from "mixpanel";
import { wrapAxios } from "../lambda-helpers";

mixpanel.init(process.env.MIXPANEL_TOKEN);

export const handler = async (event: APIGatewayEvent) => {
  mixpanel.track("Use Extension", {
    extensionId: "article",
    action: "Import",
  });
  const { url } = JSON.parse(event.body);
  return wrapAxios(axios.get(url));
};
