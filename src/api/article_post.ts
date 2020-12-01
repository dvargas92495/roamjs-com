import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { wrapAxios } from "../lambda-helpers";

export const handler = async (event: APIGatewayEvent) => {
  const { url } = JSON.parse(event.body);
  return wrapAxios(axios.get(url));
};
