import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) => {
    const data = JSON.parse(event.body);
    return axios
      .post(
        `${process.env.FLOSS_API_URL}/project-fund`,
        {
          ...data,
          customer: user?.privateMetadata?.stripeId,
          successPath: `projects/${data.uuid}?checkout=true`,
          cancelPath: `projects/${data.uuid}`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLOSS_TOKEN}`,
            Origin: event.headers.origin || event.headers.Origin,
          },
        }
      )
      .then((r) => ({
        statusCode: 200,
        body: JSON.stringify(r.data),
        headers: headers(event),
      }))
      .catch((e) => ({
        statusCode: e.response.status,
        body: e.response.data,
        headers: headers(event),
      }));
  });
