const axios = require("axios");

const title = process.argv[2];
const identifier = "(Closes #";
const headers = {
  Accept: "Accept: application/vnd.github.inertia-preview+json",
  Authorization: `Basic ${Buffer.from(
    `dvargas92495:${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
  ).toString("base64")}`,
};

const issueNumber = title.substring(
  title.indexOf(identifier) + identifier.length,
  title.length - 1
);
axios
  .get(
    "https://api.github.com/repos/dvargas92495/roam-js-extensions/projects?state=open",
    { headers }
  )
  .then((r) =>
    Promise.all(
      r.data.map((p) =>
        axios.get(`https://api.github.com/projects/${p.id}/columns`, {
          headers,
        })
      )
    )
  )
  .then((r) =>
    Promise.all(
      r.map((ri) =>
        axios.get(
          ri.data.find((c) => c.name.toUpperCase() === "TO DO").cards_url,
          { headers }
        )
      )
    )
  )
  .then((r) =>
    r
      .find((ri) => ri.data.find((c) => c.content_url.endsWith(issueNumber)))
      .data.find((c) => c.content_url.endsWith(issueNumber))
  )
  .then((r) =>
    axios
      .get(`${r.project_url}/columns`, { headers })
      .then((cs) =>
        axios.post(
          `https://api.github.com/projects/columns/cards/${r.id}/moves`,
          {
            position: "bottom",
            column_id: cs.data.find(
              (c) => c.name.toUpperCase() === "IN PROGRESS"
            ).id,
          },
          { headers }
        )
      )
  )
  .then((r) => console.log(r.status))
  .catch((e) => console.error(e.response ? e.response.data : e.message));
