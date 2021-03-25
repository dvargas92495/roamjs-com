import {
  authenticate,
  dynamo,
  emptyResponse,
  serverError,
} from "../lambda-helpers";

export const handler = authenticate(
  (event) =>
    dynamo
      .deleteItem({
        TableName: "RoamJSSocial",
        Key: { uuid: { S: event.queryStringParameters.uuid } },
      })
      .promise()
      .then(() => emptyResponse(event))
      .catch((e) => serverError(e.message, event)),
  "social"
);
