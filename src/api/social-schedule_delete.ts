import { authenticate, dynamo, emptyResponse } from "../lambda-helpers";

export const handler = authenticate((event) =>
  dynamo
    .deleteItem({
      TableName: "RoamJSSocial",
      Key: { uuid: { S: event.queryStringParameters.uuid } },
    })
    .promise()
    .then(() => emptyResponse(event))
);
