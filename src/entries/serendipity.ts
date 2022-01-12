import { addDays, differenceInMilliseconds, startOfDay } from "date-fns";
import differenceInDays from "date-fns/differenceInDays";
import isAfter from "date-fns/isAfter";
import dateMax from "date-fns/max";
import {
  createBlock,
  createBlockObserver,
  createButtonObserver,
  createIconButton,
  getAllBlockUidsAndTexts,
  getBasicTreeByParentUid,
  getBlockUidByTextOnPage,
  getBlockUidsReferencingPage,
  getChildrenLengthByPageUid,
  getPageTitleByBlockUid,
  getPageTitlesReferencingBlockUid,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  getUids,
  getUidsFromButton,
  localStorageGet,
  localStorageSet,
  parseRoamDate,
  toRoamDate,
  toRoamDateUid,
  TreeNode,
} from "roam-client";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import {
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
} from "../components/hooks";
import {
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

const LOCAL_STORAGE_KEY = "serendipity-daily";

const pullDaily = ({
  date,
  tree = getTreeByPageName("roam/js/serendipity").find((t) =>
    /daily/i.test(t.text)
  )?.children || [],
  label = getSettingValueFromTree({
    tree,
    key: "label",
    defaultValue: DEFAULT_DAILY_LABEL,
  }),
}: {
  date: Date;
  tree?: TreeNode[];
  label?: string;
}) => {
  const todayPageUid = toRoamDateUid(date);
  const includes = getSettingValuesFromTree({
    tree,
    key: "includes",
  });
  if (includes.length === 0) {
    createBlock({
      node: {
        text: label,
        children: [
          {
            text: `The set of block references to randomly choose from is empty. Add some tags in the \`includes\` field on #[[${CONFIG}]]!`,
          },
        ],
      },
      parentUid: todayPageUid,
    });
    return;
  }
  const location = getSettingValueFromTree({
    tree,
    key: "location",
    defaultValue: "TOP",
  });
  const labelUid = createBlock({
    node: { text: label, children: [{ text: "Loading..." }] },
    parentUid: todayPageUid,
    order: location === "BOTTOM" ? getChildrenLengthByPageUid(todayPageUid) : 0,
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
  const excludes = getSettingValuesFromTree({
    tree,
    key: "excludes",
  });
  const excludeBlockUids = new Set(
    excludes.map(extractTag).flatMap((tag) => getBlockUidsReferencingPage(tag))
  );

  const allBlockMapper = (t: Node): Node[] => [
    t,
    ...t.children
      .filter(({ uid }) => !excludeBlockUids.has(uid))
      .flatMap(allBlockMapper),
  ];

  setTimeout(() => {
    try {
      const includeBlocks = includes.some((i) => i === "{all}")
        ? getAllBlockUidsAndTexts()
        : includes
            .map(extractTag)
            .flatMap((tag) => getBlockUidsReferencingPage(tag))
            .filter((uid) => !excludeBlockUids.has(uid))
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
            .map((o) => JSON.stringify(o))
        )
      ).map((s) => JSON.parse(s) as { uid: string; text: string });
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
      getBasicTreeByParentUid(labelUid).forEach(({ uid }) =>
        window.roamAlphaAPI.deleteBlock({ block: { uid } })
      );
      children.forEach((node, order) =>
        createBlock({
          node,
          parentUid: labelUid,
          order,
        })
      );
      localStorageSet(LOCAL_STORAGE_KEY, JSON.stringify({latest: date.valueOf()}));
    } catch (e) {
      getBasicTreeByParentUid(labelUid).forEach(({ uid }) =>
        window.roamAlphaAPI.deleteBlock({ block: { uid } })
      );
      createBlock({
        node: {
          text: "An error occured while pulling block references. Email support@roamjs.com with this error:",
          children: [{ text: e.message }],
        },
        parentUid: labelUid,
      });
    }
  }, 1);
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
            {
              title: "location",
              type: "select",
              description:
                "Where the daily serendipity block should be inserted on the DNP",
              options: {
                items: ["TOP", "BOTTOM"],
              },
            },
          ],
        },
      ],
    },
  });

  if (!localStorageGet(LOCAL_STORAGE_KEY)) {
    localStorageSet(LOCAL_STORAGE_KEY, JSON.stringify({ latest: 0 }));
  }

  const timeoutFunction = () => {
    const date = new Date();
    const todayPage = toRoamDate(date);
    const tree =
      getTreeByPageName("roam/js/serendipity").find((t) =>
        /daily/i.test(t.text)
      )?.children || [];
    const label = getSettingValueFromTree({
      tree,
      key: "label",
      defaultValue: DEFAULT_DAILY_LABEL,
    });
    const { latest } = JSON.parse(localStorageGet(LOCAL_STORAGE_KEY)) as {
      latest: number;
    };
    if (
      !getBlockUidByTextOnPage({ text: label, title: todayPage }) &&
      isAfter(startOfDay(date), startOfDay(latest))
    ) {
      pullDaily({ date, tree, label });
    }
    const tomorrow = addDays(startOfDay(date), 1);
    setTimeout(timeoutFunction, differenceInMilliseconds(tomorrow, date));
  };
  timeoutFunction();

  createButtonObserver({
    shortcut: "serendipity",
    attribute: "serendipity-daily",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      const todayPage = getPageTitleByBlockUid(blockUid);
      if (DAILY_NOTE_PAGE_REGEX.test(todayPage)) {
        b.onclick = () =>
          pullDaily({ date: parseRoamDate(todayPage) });
      }
    },
  });

  createBlockObserver((b) => {
    const { blockUid, parentUid } = getUids(b);
    if (parentUid.length === 10) {
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
