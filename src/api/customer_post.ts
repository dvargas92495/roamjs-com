import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import axios from "axios";
import { bareSuccessResponse } from "../lambda-helpers";
import { Webhook } from "diahook";

const wh = new Webhook(process.env.DIAHOOK_SECRET);
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const {
    id,
    first_name,
    last_name,
    email_addresses,
    primary_email_address_id,
  } = wh.verify(event.body, {
    "dh-id": event.headers["dh-id"] || event.headers["Dh-Id"],
    "dh-signature":
      event.headers["dh-signature"] || event.headers["Dh-Signature"],
    "dh-timestamp":
      event.headers["dh-timestamp"] || event.headers["Dh-Timestamp"],
  }) as {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: { id: string; email_address: string }[];
    primary_email_address_id: string;
  };
  const email = email_addresses.find((e) => e.id === primary_email_address_id)
    .email_address;
  return axios
    .put(`${process.env.FLOSS_API_URL}/stripe-user`, {
      name: `${first_name} ${last_name}`,
      email,
    })
    .then((r) =>
      users.updateUser(id, {
        privateMetadata: {
          stripeId: r.data.customer,
        },
      })
    )
    .then((user) =>
      ses
        .sendEmail({
          Destination: {
            ToAddresses: [email],
          },
          Message: {
            Subject: {
              Charset: "UTF-8",
              Data: "Welcome to RoamJS!",
            },
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: `<div>
<p>Welcome ${first_name}!</p>
<br>
<p>Thanks for signing up for RoamJS!</p>
<p>You already had access to the many free to use Roam extensions offered by RoamJS, which could be found <a href="https://roamjs.com/docs">here.</a></p>
<p>Now with a RoamJS account, you have access to <b>premium</b> RoamJS services to really get the most out of your Roam graph. Browse through the available services <a href="https://roamjs.com/services">here!</a></p>
<p>If you have any questions, always feel free to reach out <a href="mailto:support@roamjs.com">support@roamjs.com.</a></p>
<p>Excited to have you join the rest of Roam's power users!</p>
<br>
<p>Best,</p>
<p>RoamJS</p>
</div>`,
              },
            },
          },
          Source: "support@roamjs.com",
        })
        .promise()
        .then(() => user)
    )
    .then((user) =>
      ses
        .sendEmail({
          Destination: {
            ToAddresses: ["dvargas92495@gmail.com"],
          },
          Message: {
            Body: {
              Text: {
                Charset: "UTF-8",
                Data: `${first_name} ${last_name} just signed up on RoamJS!

Make sure they are linked to a stripe customer here: https://dashboard.clerk.dev/instances/ins_1oXZdmHyu1Lej3hCAgZjG8yJVV4/users/${user.id}`,
              },
            },
            Subject: {
              Charset: "UTF-8",
              Data: "New user signed up on RoamJS!",
            },
          },
          Source: "support@roamjs.com",
        })
        .promise()
    )
    .then(() => bareSuccessResponse(event));
};
