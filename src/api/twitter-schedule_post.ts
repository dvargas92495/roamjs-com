import { v4 } from "uuid";
import { authenticate, bareSuccessResponse, dynamo } from "../lambda-helpers";

export const handler = authenticate((event) => {
  const { scheduleDate, oauth, payload } = JSON.parse(event.body || "{}");
  const uuid = v4();
  return dynamo
    .putItem({
      TableName: "RoamJSSocial",
      Item: {
        uuid: { S: uuid },
        created: { S: new Date().toJSON() },
        date: { S: scheduleDate },
        oauth: { S: oauth },
        payload: { S: payload },
        status: { S: "PENDING" },
        userId: { S: event.headers.Authorization },
        channel: {S: 'twitter'}
      },
    })
    .promise()
    .then(() => bareSuccessResponse(event));
});
