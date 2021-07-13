import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import addMinutes from "date-fns/addMinutes";
import isAfter from "date-fns/isAfter";
import { bareSuccessResponse, dynamo, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const S = event.queryStringParameters?.state || '';
  const key = {
    TableName: "RoamJSAuth",
    Key: { id: { S } },
  };
  return dynamo
    .getItem(key)
    .promise()
    .then((r) => {
      if (r.Item) {
        if (isAfter(new Date(), addMinutes(new Date(r.Item.date.S), 10))) {
          return dynamo
            .deleteItem(key)
            .promise()
            .then(() => bareSuccessResponse(event));
        } else {
          return {
            statusCode: 200,
            body: JSON.stringify({ success: false }),
            headers: headers(event),
          };
        }
      } else {
        return bareSuccessResponse(event);
      }
    })
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers: headers(event),
    }));
};
