const axios = require("axios");
const startOfWeek = require("date-fns/startOfWeek");
const isBefore = require("date-fns/isBefore");
const subWeeks = require("date-fns/subWeeks");
const addDays = require("date-fns/addDays");
const fs = require("fs");

const monday = addDays(startOfWeek(new Date()), 1);
const since = isBefore(monday, new Date())
  ? monday
  : subWeeks(monday, isNaN(process.argv[2]) ? 1 : parseInt(process.argv[2]));
const run = async () => {
  const enhancements = await axios.get(
    `https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=enhancement`
  );
  const extensions = await axios.get(
    `https://api.github.com/repos/dvargas92495/roam-js-extensions/issues?labels=extension`
  );
  [...enhancements.data, ...extensions.data]
    .filter((i) => isBefore(since, new Date(i.created_at)))
    .forEach((i) =>
      console.log(
        `\t<li><a href="https://roamjs.com/queue/${i.number}">${i.labels[0].name}</a> - ${i.title}</li>`
      )
    );
};
// run();
const commits = () => {
  const since = new Date(Date.parse(process.argv[2])).toISOString();
  const opts = {
    headers: {
      Accept: "application/vnd.github.inertia-preview+json",
      Authorization: `Basic ${Buffer.from(
        `dvargas92495:${process.env.GITHUB_TOKEN}`
      ).toString("base64")}`,
    },
  };
  const getRepos = (page) =>
    axios
      .get(`https://api.github.com/users/dvargas92495/repos?page=${page}`, opts)
      .then((r) => r.data.map((d) => d.name))
      .then((r) =>
        r.length ? getRepos(page + 1).then((rr) => [...r, ...rr]) : []
      );
  return getRepos(1)
    .then((repos) => repos.filter((r) => /^roam/.test(r)))
    .then((repos) => {
      const getCommits = (repo, page) =>
        axios
          .get(
            `https://api.github.com/repos/dvargas92495/${repo}/commits?page=${page}&since=${since}`,
            opts
          )
          .then((r) =>
            r.data.map((d) => ({
              message: d.commit.message,
              repo,
              date: new Date(d.commit.committer.date),
            }))
          )
          .then((r) =>
            r.length
              ? getCommits(repo, page + 1).then((rr) => [...r, ...rr])
              : []
          )
          .catch((e) => {
            console.log("Getting", page, "commits for repo", repo, "failed");
            console.log(e.response ? e.response.data : e);
            return [];
          });
      return Promise.all(repos.map((repo) => getCommits(repo, 1))).then((res) =>
        res.flatMap((c) => c).sort(({date: a}, {date: b}) => a.valueOf() - b.valueOf())
      );
    });
};

commits()
  .then((s) => fs.writeFileSync("out/github.json", JSON.stringify(s, null, 2)))
  .then(() => console.log("Done!"));
