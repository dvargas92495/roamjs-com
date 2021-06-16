import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { getClerkOpts, getClerkUser, headers } from "../lambda-helpers";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> =>
  getClerkUser(event).then((user) =>
    user
      ? Promise.all([
          axios.get<{
            contracts: {
              name: string;
              link: string;
              uuid: string;
              createdDate: string;
              dueDate: string;
              reward: number;
            }[];
          }>(
            `${process.env.FLOSS_API_URL}/contract-by-email`,
            getClerkOpts(
              user.emailAddresses.find(
                (e) => e.id === user.primaryEmailAddressId
              )?.emailAddress
            )
          ),
          axios.get<{
            projects: { uuid: string; name: string; funding: number }[];
          }>(
            `${process.env.FLOSS_API_URL}/projects?customer=${user.privateMetadata.stripeId}`
          ),
        ]).then(([r, s]) => ({
          statusCode: 200,
          body: JSON.stringify({
            contracts: r.data.contracts.map((rr) => ({
              link: `queue/${rr.link.substring(
                "https://github.com/dvargas92495/roam-js-extensions/issues"
                  .length
              )}`,
              name: rr.name,
              uuid: rr.uuid,
              description: `Funded on ${rr.createdDate}. Due on ${rr.dueDate}`,
              funding: rr.reward,
            })),
            projects: s.data.projects.map((ss) => ({
              link: `projects/${ss.uuid}`,
              uuid: ss.uuid,
              name: ss.name,
              funding: ss.funding,
              description: "",
            })),
          }),
          headers: headers(event),
        }))
      : Promise.resolve({
          statusCode: 401,
          body: "No Active Session",
          headers: headers(event),
        })
  );
