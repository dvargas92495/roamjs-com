import format from "date-fns/format";
import { RestClient } from "roam-client";

const client = new RestClient({
  graphName: "roam-js-extensions",
});

export const handler = async () => {
  const parentUid = format(new Date(), "MM-dd-yyyy");
  const output = await client.createBlock({
    parentUid,
    order: 1,
    text: "Testing Automations!",
  });
  console.log(output);
};
