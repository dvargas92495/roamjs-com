import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { emptyResponse } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event.body);
  return emptyResponse(event);
  /*
  getClerkUser(event).then((user) =>
    user
      ? axios
          .put(`${process.env.FLOSS_API_URL}/stripe-user`, {
            name: `${user.firstName} ${user.lastName}`,
            email: user.emailAddresses.find(
              (e) => e.id === user.primaryEmailAddressId
            ).emailAddress,
          })
          .then((r) => ({
            statusCode: 200,
            body: JSON.stringify(r.data),
            headers: headers(event),
          }))
      : Promise.resolve({
          statusCode: 401,
          body: "No Active Session",
          headers: headers(event),
        })
  );*/
};
