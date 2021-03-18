import { authenticate, bareSuccessResponse, dynamo } from "../lambda-helpers";

export const handler = authenticate((event) => {
  const { scheduleDate, payload, uuid } = JSON.parse(event.body || "{}");
  return dynamo
    .updateItem({
      TableName: "RoamJSSocial",
      Key: {
        uuid: { S: uuid },
      },
      UpdateExpression: "SET #d = :d, #p = :p",
      ExpressionAttributeNames: {
        "#d": "date",
        "#p": "payload",
      },
      ExpressionAttributeValues: {
        ":d": { S: scheduleDate },
        ":p": { S: payload },
      },
    })
    .promise()
    .then(() => bareSuccessResponse(event));
});
