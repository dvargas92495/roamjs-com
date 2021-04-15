import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const {
    first_name,
    last_name,
    email_addresses,
    primary_email_address_id,
  } = JSON.parse(event.body || "{}") as {
    id: string,
    first_name: string,
    last_name: string,
    email_addresses: {id: string, email_address: string}[],
    primary_email_address_id: string,
  };
  return axios
    .put(`${process.env.FLOSS_API_URL}/stripe-user`, {
      name: `${first_name} ${last_name}`,
      email: email_addresses.find((e) => e.id === primary_email_address_id)
        .email_address,
    })
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers: headers(event),
    }));
};
