import setDay from "date-fns/setDay";
import dateFnsFormat from "date-fns/format";
import parse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import subWeeks from "date-fns/subWeeks";
import {
  createBlock,
  createPage,
  getPageTitleByPageUid,
  getPageUidByPageTitle,
  getTreeByPageName,
  toRoamDate,
} from "roam-client";
import { createConfigObserver } from "roamjs-components";
import { getSettingValueFromTree } from "../components/hooks";
import {
  getRoamUrl,
  isApple,
  runExtension,
  toFlexRegex,
} from "../entry-helpers";
import { render } from "../components/Toast";

const ID = "weekly-notes";
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const DATE_REGEX = new RegExp(`{(${DAYS.join("|")}):(.*?)}`, "g");
const FORMAT_DEFAULT_VALUE = "{monday:MM/dd yyyy} - {sunday:MM/dd yyyy}";
const CONFIG = `roam/js/${ID}`;

const getFormat = (tree = getTreeByPageName(CONFIG)) =>
  getSettingValueFromTree({
    key: "format",
    defaultValue: FORMAT_DEFAULT_VALUE,
    tree,
  });

const createWeeklyPage = (pageName: string) => {
  const weekUid = createPage({ title: pageName });
  const tree = getTreeByPageName(CONFIG);
  const format = getFormat(tree);
  const [, day, dayFormat] = format.match(new RegExp(DATE_REGEX.source));
  const firstDateFormatted = pageName.match(
    new RegExp(
      format
        .replace(/{(.*?)}/g, "(.*?)")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")
    )
  )[1];
  const date = parse(firstDateFormatted, dayFormat, new Date());
  const weekStartsOn = DAYS.indexOf(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const autoTag = tree.some((t) => toFlexRegex("auto tag").test(t.text));
  const autoEmbed = tree.some((t) => toFlexRegex("auto embed").test(t.text));
  DAYS.forEach((_, i) => {
    const dayDate = setDay(date, i, { weekStartsOn });
    const title = toRoamDate(dayDate);
    if (autoTag) {
      const parentUid = getPageUidByPageTitle(title) || createPage({ title });
      createBlock({ node: { text: `#[[${pageName}]]` }, parentUid });
    }
    if (autoEmbed) {
      createBlock({
        node: { text: `{{[[embed]]:[[${title}]]}}` },
        parentUid: weekUid,
        order: (i - weekStartsOn + 7) % 7,
      });
    }
  });
  return weekUid;
};

const navigateToPage = (pageName: string) => {
  const existingPageUid = getPageUidByPageTitle(pageName);
  const { pageUid, timeout } = existingPageUid
    ? { pageUid: existingPageUid, timeout: 1 }
    : { pageUid: createWeeklyPage(pageName), timeout: 500 };
  setTimeout(() => {
    if (pageUid) {
      window.location.assign(getRoamUrl(pageUid));
    }
  }, timeout);
};

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              title: "format",
              type: "text",
              defaultValue: FORMAT_DEFAULT_VALUE,
              description:
                "Format of your weekly page titles. When changing the format, be sure to rename your old weekly pages.",
            },
            {
              title: "auto load",
              type: "flag",
              description:
                "Automatically load the current weekly note on initial Roam load of daily note page",
            },
            {
              title: "auto tag",
              type: "flag",
              description:
                "Automatically tag the weekly page on all the related daily pages when it's created",
              defaultValue: true,
            },
            {
              title: "auto embed",
              type: "flag",
              description:
                "Automatically embed the related daily pages into a newly created weekly page",
            },
          ],
        },
      ],
    },
  });

  const goToThisWeek = () => {
    const format = getFormat();
    const today = new Date();
    const weekStartsOn = DAYS.indexOf(
      format.match(new RegExp(DATE_REGEX.source))?.[1] || "sunday"
    ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const pageName = format.replace(DATE_REGEX, (_, day, f) => {
      const dayOfWeek = setDay(today, DAYS.indexOf(day), { weekStartsOn });
      return dateFnsFormat(dayOfWeek, f);
    });
    navigateToPage(pageName);
  };

  document.addEventListener("keydown", (e) => {
    if (
      e.code === "KeyW" &&
      (e.altKey || (e.ctrlKey && e.shiftKey && isApple))
    ) {
      e.preventDefault();
      e.stopPropagation();
      goToThisWeek();
    }
  });

  const hashListener = (newUrl: string) => {
    document.getElementById("roamjs-weekly-mode-nav")?.remove?.();
    const urlUid = newUrl.match(/\/page\/(.*)$/)?.[1];
    if (urlUid) {
      const title = getPageTitleByPageUid(urlUid);
      const format = getFormat();
      const formats: string[] = [];
      const formatRegex = new RegExp(
        `^${format
          .replace(DATE_REGEX, (_, __, og) => {
            formats.push(og);
            return "(.*?)";
          })
          .replace(/\[/g, "\\[")
          .replace(/\]/g, "\\]")}$`
      );
      const exec = formatRegex.exec(title);
      if (exec) {
        const dateArray = exec
          .slice(1)
          .map((d, i) => parse(d, formats[i], new Date()));
        if (dateArray.length && dateArray.every((s) => !isNaN(s.valueOf()))) {
          const prevTitle = dateArray.reduce(
            (prev, cur, i) =>
              prev.replace(
                dateFnsFormat(cur, formats[i]),
                dateFnsFormat(subWeeks(cur, 1), formats[i])
              ),
            title
          );
          const nextTitle = dateArray.reduce(
            (prev, cur, i) =>
              prev.replace(
                dateFnsFormat(cur, formats[i]),
                dateFnsFormat(addWeeks(cur, 1), formats[i])
              ),
            title
          );
          setTimeout(() => {
            const header = document.querySelector(
              ".roam-article h1.rm-title-display"
            ) as HTMLHeadingElement;
            header.onmousedown = (e) => {
              render({
                id: "week-uid",
                content: "Weekly Note Titles Cannot be Changed",
              });
              e.stopPropagation();
            };
            const headerContainer = header.parentElement;
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.justifyContent = "space-between";
            buttonContainer.style.marginBottom = "32px";
            buttonContainer.id = "roamjs-weekly-mode-nav";
            headerContainer.appendChild(buttonContainer);

            const makeButton = (pagename: string, label: string) => {
              const button = document.createElement("button");
              button.className = "bp3-button";
              button.onclick = () => navigateToPage(pagename);
              button.innerText = label;
              buttonContainer.appendChild(button);
            };
            makeButton(prevTitle, "Last Week");
            makeButton(nextTitle, "Next Week");
          });
        }
      }
    }
  };
  window.addEventListener("hashchange", (e) => hashListener(e.newURL));
  hashListener(window.location.href);

  const autoLoad = getTreeByPageName(CONFIG).some((t) =>
    toFlexRegex("auto load").test(t.text)
  );
  if (autoLoad && !window.location.hash.includes("/page/")) {
    goToThisWeek();
  }
});
