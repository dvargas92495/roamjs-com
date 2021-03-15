const axios = require("axios");
const startOfWeek = require("date-fns/startOfWeek");
const isBefore = require("date-fns/isBefore");
const subWeeks = require("date-fns/subWeeks");
const addDays = require("date-fns/addDays");

const monday = addDays(startOfWeek(new Date()), 1);
const since = isBefore(monday, new Date()) ? monday : subWeeks(monday, 1);
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
    console.log(`\t<li><a href="https://roamjs.com/queue/${i.number}">${i.labels[0].name}</a> - ${i.title}</li>`)
  );
};
run();
