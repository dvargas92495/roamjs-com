import differenceInDays from "date-fns/differenceInDays";
import dateMax from "date-fns/max";
import {
  createBlock,
  createPage,
  getAllBlockUids,
  getBlockUidByTextOnPage,
  getBlockUidsReferencingPage,
  getPageTitleByBlockUid,
  getPageTitlesReferencingBlockUid,
  getPageUidByPageTitle,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  getUidsFromButton,
  parseRoamDate,
  toRoamDate,
  toRoamDateUid,
} from "roam-client";
import { createConfigObserver } from "../components/ConfigPage";
import {
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
} from "../components/hooks";
import {
  createButtonObserver,
  DAILY_NOTE_PAGE_REGEX,
  extractTag,
  getWordCount,
  runExtension,
} from "../entry-helpers";

const ID = "serendipity";
const CONFIG = `roam/js/${ID}`;
const DEFAULT_DAILY_LABEL = `#[[${CONFIG}]]`;
const DEFAULT_DAILY_COUNT = 3;
const DEFAULT_TIMEOUT_COUNT = 0;

type Node = {
  uid: string;
  text: string;
  children: Node[];
};

const pullDaily = ({ todayPage }: { todayPage: string }) => {
  const date = parseRoamDate(todayPage);
  const todayPageUid = toRoamDateUid(date);
  const tree =
    getTreeByPageName("roam/js/serendipity").find((t) => /daily/i.test(t.text))
      ?.children || [];
  const label = getSettingValueFromTree({
    tree,
    key: "label",
    defaultValue: DEFAULT_DAILY_LABEL,
  });
  if (!getBlockUidByTextOnPage({ text: label, title: todayPage })) {
    const count = getSettingIntFromTree({
      tree,
      key: "count",
      defaultValue: DEFAULT_DAILY_COUNT,
    });
    const timeout = getSettingIntFromTree({
      tree,
      key: "timeout",
      defaultValue: DEFAULT_TIMEOUT_COUNT,
    });
    const characterMinimum = getSettingIntFromTree({
      tree,
      key: "character minimum",
    });
    const wordMinimum = getSettingIntFromTree({
      tree,
      key: "word minimum",
    });
    const includes = getSettingValuesFromTree({
      tree,
      key: "includes",
    });
    const excludes = getSettingValuesFromTree({
      tree,
      key: "excludes",
    });
    const excludeBlockUids = new Set(
      excludes
        .map(extractTag)
        .flatMap((tag) => getBlockUidsReferencingPage(tag))
    );

    const allBlockMapper = (t: Node): Node[] => [
      t,
      ...t.children
        .filter(({ uid }) => !excludeBlockUids.has(uid))
        .flatMap(allBlockMapper),
    ];

    const includeBlockUidCandidates = includes.some((i) => i === "{all}")
      ? getAllBlockUids()
      : includes
          .map(extractTag)
          .flatMap((tag) => getBlockUidsReferencingPage(tag));

    const includeBlockUids = includeBlockUidCandidates.flatMap((uid) => [
      ...(excludeBlockUids.has(uid) ? [] : [uid]),
      ...allBlockMapper({ ...getTreeByBlockUid(uid), uid }).map((b) => b.uid),
    ]);

    const blockUids = Array.from(
      new Set(
        includeBlockUids
          .filter((u) => !excludeBlockUids.has(u))
          .filter((u) => {
            const text = getTextByBlockUid(u);
            return text.length >= characterMinimum && getWordCount(text) >= wordMinimum;
          })
          .filter(
            (u) =>
              differenceInDays(
                date,
                getPageTitlesReferencingBlockUid(u)
                  .filter((t) => DAILY_NOTE_PAGE_REGEX.test(t))
                  .reduce(
                    (prev, cur) => dateMax([parseRoamDate(cur), prev]),
                    new Date(0)
                  )
              ) >= timeout
          )
      )
    );
    const children = [];
    for (let c = 0; c < count; c++) {
      if (blockUids.length) {
        const i = Math.floor(Math.random() * blockUids.length);
        children.push({
          text: `((${blockUids.splice(i, 1)[0]}))`,
        });
      }
    }
    createBlock({
      node: { text: label, children },
      parentUid: todayPageUid,
    });
  }
};

runExtension(ID, () => {
  if (!getPageUidByPageTitle(CONFIG)) {
    createPage({
      title: CONFIG,
      tree: [
        {
          text: "daily",
          children: [
            {
              text: "includes",
            },
            {
              text: "excludes",
            },
            {
              text: "timeout",
              children: [
                {
                  text: `${DEFAULT_TIMEOUT_COUNT}`,
                },
              ],
            },
            {
              text: "label",
              children: [
                {
                  text: DEFAULT_DAILY_LABEL,
                },
              ],
            },
            {
              text: "count",
              children: [
                {
                  text: `${DEFAULT_DAILY_COUNT}`,
                },
              ],
            },
          ],
        },
      ],
    });
  }

  const date = new Date();
  const todayPage = toRoamDate(date);
  pullDaily({ todayPage });

  createButtonObserver({
    shortcut: "serendipity",
    attribute: "serendipity-daily",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      const todayPage = getPageTitleByBlockUid(blockUid);
      if (DAILY_NOTE_PAGE_REGEX.test(todayPage)) {
        b.onclick = () => pullDaily({ todayPage });
      }
    },
  });

  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "daily",
          fields: [
            { title: "includes", type: "pages" },
            { title: "excludes", type: "pages" },
            { title: "timeout", type: "number" },
            { title: "label", type: "text" },
            { title: "count", type: "number" },
            { title: "character minimum", type: "number" },
            { title: "word minimum", type: "number" },
          ],
        },
      ],
    },
  });
});
