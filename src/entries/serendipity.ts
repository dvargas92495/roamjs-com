import differenceInDays from "date-fns/differenceInDays";
import dateMax from "date-fns/max";
import {
  createBlock,
  createIconButton,
  getAllBlockUidsAndTexts,
  getBlockUidByTextOnPage,
  getBlockUidsReferencingPage,
  getPageTitleByBlockUid,
  getPageTitlesReferencingBlockUid,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  getUids,
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
  createBlockObserver,
  createButtonObserver,
  DAILY_NOTE_PAGE_REGEX,
  extractTag,
  getWordCount,
  openBlockInSidebar,
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
    const labelUid = createBlock({
      node: { text: label, children: [{ text: "Loading..." }] },
      parentUid: todayPageUid,
    });
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

    setTimeout(() => {
      const includeBlocks = includes.some((i) => i === "{all}")
        ? getAllBlockUidsAndTexts()
        : includes
            .map(extractTag)
            .flatMap((tag) => getBlockUidsReferencingPage(tag))
            .flatMap((uid) =>
              allBlockMapper(getTreeByBlockUid(uid)).map((b) => ({
                uid: b.uid,
                text: b.text,
              }))
            );

      const blockUids = Array.from(
        new Set(
          includeBlocks
            .filter(({ uid }) => !excludeBlockUids.has(uid))
            .filter(({ text }) => text.length >= characterMinimum)
            .filter(({ text }) => getWordCount(text) >= wordMinimum)
            .filter(({ uid }) => {
              if (timeout === 0) {
                return true;
              }
              return (
                differenceInDays(
                  date,
                  getPageTitlesReferencingBlockUid(uid)
                    .filter((t) => DAILY_NOTE_PAGE_REGEX.test(t))
                    .reduce(
                      (prev, cur) => dateMax([parseRoamDate(cur), prev]),
                      new Date(0)
                    )
                ) >= timeout
              );
            })
        )
      );
      const children: { text: string }[] = [];
      for (let c = 0; c < count; c++) {
        if (blockUids.length) {
          const i = Math.floor(Math.random() * blockUids.length);
          children.push({
            text: `((${blockUids.splice(i, 1)[0].uid}))`,
          });
        } else {
          break;
        }
      }
      getTreeByBlockUid(labelUid).children.forEach(({ uid }) =>
        window.roamAlphaAPI.deleteBlock({ block: { uid } })
      );
      children.forEach((node) =>
        createBlock({
          node,
          parentUid: labelUid,
        })
      );
    }, 1);
  }
};

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "daily",
          fields: [
            {
              title: "includes",
              type: "pages",
              description:
                "Blocks and children tagged with one of these pages will be included for random selection.",
              defaultValue: ["books"],
            },
            {
              title: "excludes",
              type: "pages",
              description:
                "Blocks and children tagged with one of these pages will be excluded from random selection.",
            },
            {
              title: "timeout",
              type: "number",
              description:
                "Number of days that must pass for a block to be reconsidere for randoom selection",
              defaultValue: DEFAULT_TIMEOUT_COUNT,
            },
            {
              title: "label",
              type: "text",
              description:
                "The block text used that all chosen block refrences will be nested under.",
              defaultValue: DEFAULT_DAILY_LABEL,
            },
            {
              title: "count",
              type: "number",
              description: "The number of randomly chosen block references",
              defaultValue: DEFAULT_DAILY_COUNT,
            },
            {
              title: "character minimum",
              type: "number",
              description:
                "Blocks must have at least this many characters to be considered for random selection.",
            },
            {
              title: "word minimum",
              type: "number",
              description:
                "Block must have at least this many words to be considered for random selection.",
            },
          ],
        },
      ],
    },
  });

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

  createBlockObserver((b) => {
    const { blockUid } = getUids(b);
    const title = getPageTitleByBlockUid(blockUid);
    if (DAILY_NOTE_PAGE_REGEX.test(title)) {
      const tree =
        getTreeByPageName("roam/js/serendipity").find((t) =>
          /daily/i.test(t.text)
        )?.children || [];
      const label = getSettingValueFromTree({
        tree,
        key: "label",
        defaultValue: DEFAULT_DAILY_LABEL,
      });
      const text = getTextByBlockUid(blockUid);
      if (text === label) {
        const container = b.closest(".rm-block-main");
        const icon = createIconButton("arrow-top-right");
        icon.style.position = "absolute";
        icon.style.top = "0";
        icon.style.right = "0";
        icon.addEventListener("click", () => {
          getTreeByBlockUid(blockUid).children.forEach((t) =>
            openBlockInSidebar(/\(\((.*?)\)\)/.exec(t.text)?.[1])
          );
        });
        container.append(icon);
      }
    }
  });
});
