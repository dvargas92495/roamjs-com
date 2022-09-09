import { addDays, differenceInMilliseconds, startOfDay } from "date-fns";
import differenceInDays from "date-fns/differenceInDays";
import isAfter from "date-fns/isAfter";
import dateMax from "date-fns/max";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import {
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
} from "../components/hooks";
import {
  DAILY_NOTE_PAGE_REGEX,
  extractTag,
  getChildrenLengthByPageUid,
  getWordCount,
} from "../entry-helpers";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import { TreeNode } from "roamjs-components/types/native";
import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createIconButton from "roamjs-components/dom/createIconButton";
import getUids from "roamjs-components/dom/getUids";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getBlockUidsReferencingPage from "roamjs-components/queries/getBlockUidsReferencingPage";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import localStorageGet from "roamjs-components/util/localStorageGet";
import localStorageSet from "roamjs-components/util/localStorageSet";
import runExtension from "roamjs-components/util/runExtension";
import createBlock from "roamjs-components/writes/createBlock";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import getAllBlockUidsAndTexts from "roamjs-components/queries/getAllBlockUidsAndTexts";
import getPageTitlesReferencingBlockUid from "roamjs-components/queries/getPageTitlesReferencingBlockUid";
import TextPanel from "roamjs-components/components/ConfigPanels/TextPanel";
import NumberPanel from "roamjs-components/components/ConfigPanels/NumberPanel";
import PagesPanel from "roamjs-components/components/ConfigPanels/PagesPanel";
import SelectPanel from "roamjs-components/components/ConfigPanels/SelectPanel";
import getBlockUidByTextOnPage from "roamjs-components/queries/getBlockUidByTextOnPage";
import {
  Field,
  SelectField,
} from "roamjs-components/components/ConfigPanels/types";

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

const pullDaily = async ({
  date,
  tree = getFullTreeByParentUid(
    getPageUidByPageTitle("roam/js/serendipity")
  ).children.find((t) => /daily/i.test(t.text))?.children || [],
  label = getSettingValueFromTree({
    tree,
    key: "label",
    defaultValue: DEFAULT_DAILY_LABEL,
  }),
  isDate = true,
}: {
  date: Date;
  tree?: TreeNode[];
  label?: string;
  isDate?: boolean;
}) => {
  const parentUid = isDate
    ? window.roamAlphaAPI.util.dateToPageUid(date)
    : await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
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
      parentUid,
    });
    return;
  }
  const location = getSettingValueFromTree({
    tree,
    key: "location",
    defaultValue: "TOP",
  });
  const labelUid = await createBlock({
    node: { text: label, children: [{ text: "Loading..." }] },
    parentUid,
    order: location === "BOTTOM" ? getChildrenLengthByPageUid(parentUid) : 0,
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
              allBlockMapper(getFullTreeByParentUid(uid)).map((b) => ({
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
                      (prev, cur) =>
                        dateMax([
                          window.roamAlphaAPI.util.pageTitleToDate(cur),
                          prev,
                        ]),
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
      localStorageSet(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ latest: date.valueOf() })
      );
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
              Panel: PagesPanel,
              description:
                "Blocks and children tagged with one of these pages will be included for random selection.",
              defaultValue: ["books"],
            },
            {
              title: "excludes",
              Panel: PagesPanel,
              description:
                "Blocks and children tagged with one of these pages will be excluded from random selection.",
            },
            {
              title: "timeout",
              Panel: NumberPanel,
              description:
                "Number of days that must pass for a block to be reconsidere for randoom selection",
              defaultValue: DEFAULT_TIMEOUT_COUNT,
            },
            {
              title: "label",
              Panel: TextPanel,
              description:
                "The block text used that all chosen block refrences will be nested under.",
              defaultValue: DEFAULT_DAILY_LABEL,
            },
            {
              title: "count",
              Panel: NumberPanel,
              description: "The number of randomly chosen block references",
              defaultValue: DEFAULT_DAILY_COUNT,
            },
            {
              title: "character minimum",
              Panel: NumberPanel,
              description:
                "Blocks must have at least this many characters to be considered for random selection.",
            },
            {
              title: "word minimum",
              Panel: NumberPanel,
              description:
                "Block must have at least this many words to be considered for random selection.",
            },
            {
              title: "location",
              Panel: SelectPanel,
              description:
                "Where the daily serendipity block should be inserted on the DNP",
              options: {
                items: ["TOP", "BOTTOM"],
              },
            } as Field<SelectField>,
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
    const todayPage = window.roamAlphaAPI.util.dateToPageTitle(date);
    const tree =
      getFullTreeByParentUid(
        getPageUidByPageTitle("roam/js/serendipity")
      ).children.find((t) => /daily/i.test(t.text))?.children || [];
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
          pullDaily({
            date: window.roamAlphaAPI.util.pageTitleToDate(todayPage),
          });
      } else {
        b.onclick = () => pullDaily({ date: new Date(), isDate: false });
      }
    },
  });

  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Run Serendipity",
    callback: async () => {
      const todayPage = getPageTitleByPageUid(
        await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()
      );
      if (DAILY_NOTE_PAGE_REGEX.test(todayPage)) {
        pullDaily({
          date: window.roamAlphaAPI.util.pageTitleToDate(todayPage),
        });
      } else {
        pullDaily({ date: new Date(), isDate: false });
      }
    },
  });

  createBlockObserver((b) => {
    const { blockUid } = getUids(b);
    const parentUid = getPageTitleByBlockUid(blockUid);
    if (parentUid.length === 10) {
      const tree =
        getFullTreeByParentUid(
          getPageUidByPageTitle("roam/js/serendipity")
        ).children.find((t) => /daily/i.test(t.text))?.children || [];
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
          getFullTreeByParentUid(blockUid).children.forEach((t) =>
            openBlockInSidebar(/\(\((.*?)\)\)/.exec(t.text)?.[1])
          );
        });
        container.append(icon);
      }
    }
  });
});
