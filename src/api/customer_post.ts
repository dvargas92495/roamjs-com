import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import {
  bareSuccessResponse,
  emailCatch,
  emptyResponse,
  generateToken,
  ses,
  stripe,
} from "../lambda-helpers";
import { Webhook } from "diahook";

const wh = new Webhook(process.env.DIAHOOK_SECRET);
const ckApiSecret = process.env.CONVERTKIT_API_TOKEN;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  Promise.resolve()
    .then(() => {
      const payload = wh.verify(event.body, {
        "svix-id": event.headers["svix-id"] || event.headers["Svix-Id"],
        "svix-signature":
          event.headers["svix-signature"] || event.headers["Svix-Signature"],
        "svix-timestamp":
          event.headers["svix-timestamp"] || event.headers["Svix-Timestamp"],
      }) as { data?: Record<string, string>; type?: string };
      if (payload.type && payload.type !== "user.created") {
        return emptyResponse(event);
      }
      const data = (payload.data || payload) as {
        id: string;
        first_name: string;
        last_name: string;
        email_addresses: { id: string; email_address: string }[];
        primary_email_address_id: string;
        private_metadata: { stripeId?: string };
      };
      const {
        id,
        first_name,
        last_name,
        email_addresses,
        primary_email_address_id,
        private_metadata,
      } = data;
      if (private_metadata.stripeId) {
        return emptyResponse(event);
      }
      const { encrypted: token } = generateToken();
      const email = email_addresses.find(
        (e) => e.id === primary_email_address_id
      ).email_address;
      return stripe.customers
        .list({
          email,
        })
        .then((existingCustomers) =>
          existingCustomers.data.length
            ? Promise.resolve(existingCustomers.data[0])
            : stripe.customers.create({
                email,
                name: `${first_name} ${last_name}`,
              })
        )
        .then((r) =>
          axios
            .get(
              `https://api.convertkit.com/v3/subscribers?api_secret=${ckApiSecret}&email_address=${email}`
            )
            .then((ck) =>
              ck.data.total_subscribers > 0
                ? ck.data.subscribers[0].id
                : axios
                    .post(
                      "https://api.convertkit.com/v3/forms/2239289/subscribe",
                      {
                        api_secret: ckApiSecret,
                        email,
                      }
                    )
                    .then((sub) => sub.data.subscription.subscriber.id)
            )
            .then((convertKit) => ({
              stripeId: r.id,
              convertKit,
            }))
            .catch((e) => {
              console.error(e);
              return {
                stripeId: r.id,
              };
            })
        )
        .then((d) =>
          users.updateUser(id, {
            privateMetadata: { ...d, token },
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
<p>RoamJS is a leading publisher of Roam Depot extensions. To see what we have to offer, be sure to check out the Roam Depot within Roam!</p>
<p>By signing up, you have been automatically subscribed to the RoamJS Digest, where you'll receive the latest news and updates on all things RoamJS.</p>
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
                ToAddresses: ["support@roamjs.com"],
              },
              Message: {
                Body: {
                  Text: {
                    Charset: "UTF-8",
                    Data: `${first_name} ${last_name} just signed up on RoamJS!

Make sure they are linked to a stripe customer here: https://dashboard.clerk.dev/instances/${process.env.CLERK_INSTANCE_ID}/users/${user.id}`,
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
    })
    .catch(emailCatch("Customer Creation Webhook Failed", event));
