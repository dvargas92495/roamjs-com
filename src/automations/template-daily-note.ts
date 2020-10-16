import { RestClient, toRoamDate, toRoamDateUid } from "roam-client";

const client = new RestClient({
  graphName: "roam-js-extensions",
});

export const handler = async () => {
  try {
    const today = new Date();
    const title = toRoamDate(today);
    const parentUid = toRoamDateUid(today);
    const queryResults = await client.q({
      query: `[:find ?e :where [?e :node/title "${title}"]]`,
    });
    if (queryResults.length === 0) {
      await client.createPage({
        title,
        uid: parentUid,
      });
    }
    const template = await client.q({
      query: `[:find (pull ?c [:block/string :block/order]) :where [?page :block/children ?c] [?page :node/title "roam/js/template-daily-note"]]`,
    });
    template.sort((a, b) => a["block/order"] - b["block/order"]);
    for (var b = 0; b < template.length; b++) {
      await client.createBlock({
        parentUid,
        order: template[b]["block/order"],
        text: template[b]["block/string"],
      });
    }
  } catch (e) {
    console.error(e.response.data.error);
  }
};
