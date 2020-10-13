import { handler } from "./api/github-cards_get";

// @ts-ignore
handler({
  queryStringParameters: {
    repository: "dvargas92495/website",
    project: "Phase 3 of Personal Website",
    column: "To do",
  },
})
  .then((r) => console.log(JSON.parse(r.body)))
  .catch((e) => console.error(e.message));
