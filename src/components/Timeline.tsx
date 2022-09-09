import React, { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import EditContainer from "./EditContainer";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { Checkbox, Icon, InputGroup, Label } from "@blueprintjs/core";
import {
  createTagRegex,
  DAILY_NOTE_PAGE_REGEX,
  DAILY_NOTE_TAG_REGEX,
  DAILY_NOTE_TAG_REGEX_GLOBAL,
  extractTag,
  getParseRoamMarked,
  getRoamUrl,
} from "../entry-helpers";
import getSettingIntFromTree from "roamjs-components/util/getSettingIntFromTree";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import TagFilter from "./TagFilter";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import { TreeNode } from "roamjs-components/types/native";
import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";

type TimelineProps = { blockId: string };
let parseRoamMarked: Awaited<ReturnType<typeof getParseRoamMarked>>;
getParseRoamMarked().then((f) => (parseRoamMarked = f));
const getText = (cur: string) => {
  try {
    return parseRoamMarked(cur);
  } catch {
    return cur;
  }
};

const reduceChildren = (prev: string, cur: TreeNode, l: number): string =>
  `${prev}<span>${"".padEnd(l * 2, " ")}</span>${getText(
    cur.text
  )}<br/>${cur.children.reduce((p, c) => reduceChildren(p, c, l + 1), "")}`;

const getTag = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  const tagNode = tree.children.find((t) => /tag/i.test(t.text));
  if (tagNode && tagNode.children.length) {
    return extractTag(tagNode.children[0].text);
  }
  return "";
};

const LAYOUTS = {
  LEFT: "1-column-left",
  RIGHT: "1-column-right",
  ALT: "2-columns",
};

const getLayout = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  const layoutNode = tree.children.find((t) => /layout/i.test(t.text));
  if (layoutNode && layoutNode.children.length) {
    return (
      LAYOUTS[
        layoutNode.children[0].text.toUpperCase() as keyof typeof LAYOUTS
      ] || "2-columns"
    );
  }
  return "2-columns";
};

const getColors = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  const colorNode = tree.children.find((t) => /colors/i.test(t.text));
  if (colorNode && colorNode.children.length) {
    return colorNode.children.map((c) => c.text);
  }
  return ["#2196f3"];
};

const getReverse = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  return tree.children.some((t) => /reverse/i.test(t.text));
};

const getCreationDate = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  return tree.children.some((t) => /creation date/i.test(t.text));
};

const getHideTags = (blockUid: string) => {
  const tree = getFullTreeByParentUid(blockUid);
  return tree.children.some((t) => /clean/i.test(t.text));
};

const BooleanSetting = ({
  blockUid,
  name,
  refresh,
}: {
  blockUid: string;
  name: string;
  refresh: () => void;
}) => {
  const regex = new RegExp(name, "i");
  const [booleanSetting, setBooleanSetting] = useState(() => {
    const tree = getFullTreeByParentUid(blockUid);
    return tree.children.some((t) => regex.test(t.text));
  });
  const onBooleanChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const newValue = (e.target as HTMLInputElement).checked;
      setBooleanSetting(newValue);
      if (newValue) {
        window.roamAlphaAPI.createBlock({
          location: { "parent-uid": blockUid, order: 0 },
          block: { string: name },
        });
      } else {
        const uid = getFullTreeByParentUid(blockUid).children.find((t) =>
          regex.test(t.text)
        ).uid;
        window.roamAlphaAPI.deleteBlock({
          block: { uid },
        });
      }
      setTimeout(refresh, 1);
    },
    [setBooleanSetting, blockUid, refresh]
  );
  return (
    <Checkbox
      label={name}
      onChange={onBooleanChange}
      checked={booleanSetting}
    />
  );
};

const Timeline: React.FunctionComponent<TimelineProps> = ({ blockId }) => {
  const { blockUid } = getUidsFromId(blockId);
  const depth = useMemo(
    () =>
      getSettingIntFromTree({
        tree: getFullTreeByParentUid(getPageUidByPageTitle("roam/js/timeline"))
          .children,
        key: "depth",
        defaultValue: -1,
      }),
    []
  );
  const getTimelineElements = useCallback(() => {
    const tag = getTag(blockUid);
    const reverse = getReverse(blockUid);
    const useCreationDate = getCreationDate(blockUid);
    const useHideTags = getHideTags(blockUid);
    if (tag) {
      const blocks = window.roamAlphaAPI.q(
        `[:find ?s ?pt ?u ?cd :where [?b :create/time ?cd] [?b :block/uid ?u] [?b :block/string ?s] [?p :node/title ?pt] [?b :block/page ?p] [?b :block/refs ?t] [?t :node/title "${tag}"]]`
      ) as string[][];
      return blocks
        .filter(
          ([text, pageTitle]) =>
            useCreationDate ||
            DAILY_NOTE_PAGE_REGEX.test(pageTitle) ||
            DAILY_NOTE_TAG_REGEX.test(text)
        )
        .flatMap(([text, pageTitle, uid, creationDate]) => {
          const node = getFullTreeByParentUid(uid);
          if (depth >= 0) {
            const trim = (n: TreeNode, level: number) => {
              if (level >= depth) {
                n.children = [];
              }
              n.children.forEach((c) => trim(c, level + 1));
            };
            trim(node, 0);
          }
          const { children } = node;
          const dates: string[] = useCreationDate
            ? [window.roamAlphaAPI.util.dateToPageTitle(new Date(creationDate))]
            : DAILY_NOTE_PAGE_REGEX.test(pageTitle)
            ? [pageTitle]
            : text
                .match(DAILY_NOTE_TAG_REGEX_GLOBAL)
                .map((d) => d.match(DAILY_NOTE_TAG_REGEX)?.[1]);
          return dates.map((date) => ({
            date,
            uid,
            text: resolveRefs(
              getText(
                text
                  .replace(createTagRegex(tag), (a) => (useHideTags ? "" : a))
                  .replace(DAILY_NOTE_TAG_REGEX, (a) => (useHideTags ? "" : a))
              )
            ).trim(),
            body: resolveRefs(
              children.reduce((prev, cur) => reduceChildren(prev, cur, 0), "")
            ),
          }));
        })
        .sort(({ date: a }, { date: b }) => {
          const bDate = window.roamAlphaAPI.util.pageTitleToDate(b).valueOf();
          const aDate = window.roamAlphaAPI.util.pageTitleToDate(a).valueOf();
          return reverse ? aDate - bDate : bDate - aDate;
        });
    }
    return [];
  }, [blockId]);
  const [timelineElements, setTimelineElements] = useState(getTimelineElements);
  const [filters, setFilters] = useState({ includes: [], excludes: [] });
  const filteredElements = useMemo(() => {
    const validUids = filters.includes.length
      ? new Set()
      : new Set(timelineElements.map((t) => t.uid));
    filters.includes.forEach((inc) =>
      window.roamAlphaAPI
        .q(
          `[:find ?u ?pu :where [?par :block/uid ?pu] [?b :block/parents ?par] [?b :block/uid ?u] [?b :block/refs ?p] [?p :node/title "${inc}"]]`
        )
        .map((uids) => uids.filter((u) => !!u).forEach((u) => validUids.add(u)))
    );
    filters.excludes.forEach((exc) =>
      window.roamAlphaAPI
        .q(
          `[:find ?u ?pu :where [?par :block/uid ?pu] [?b :block/parents ?par] [?b :block/uid ?u] [?b :block/refs ?p] [?p :node/title "${exc}"]]`
        )
        .map((uids) =>
          uids.filter((u) => !!u).forEach((u) => validUids.delete(u))
        )
    );
    return timelineElements.filter((t) => validUids.has(t.uid));
  }, [filters, timelineElements]);
  const [colors, setColors] = useState(() => getColors(blockUid));
  const [layout, setLayout] = useState(() => getLayout(blockUid));
  const refresh = useCallback(() => {
    setTimelineElements(getTimelineElements());
    setColors(getColors(blockUid));
    setLayout(getLayout(blockUid));
  }, [
    setTimelineElements,
    getTimelineElements,
    setColors,
    setLayout,
    blockUid,
  ]);

  const [tagSetting, setTagSetting] = useState(() => getTag(blockUid));
  const onTagBlur = useCallback(() => {
    const { blockUid } = getUidsFromId(blockId);
    const tree = getFullTreeByParentUid(blockUid);
    const tagNode = tree.children.find((t) => /tag/i.test(t.text));
    if (tagNode && tagNode.children.length) {
      window.roamAlphaAPI.updateBlock({
        block: { uid: tagNode.children[0].uid, string: tagSetting },
      });
    } else if (!tagNode) {
      const uid = window.roamAlphaAPI.util.generateUID();
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": blockUid, order: 0 },
        block: { string: "tag", uid },
      });
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": uid, order: 0 },
        block: { string: tagSetting },
      });
    } else {
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": tagNode.uid, order: 0 },
        block: { string: tagSetting },
      });
    }
    setTimeout(refresh, 1);
  }, [blockId, refresh, tagSetting]);
  const onLayoutSelect = useCallback(
    (key: keyof typeof LAYOUTS) => {
      const { blockUid } = getUidsFromId(blockId);
      const tree = getFullTreeByParentUid(blockUid);
      const layoutNode = tree.children.find((t) => /layout/i.test(t.text));
      if (layoutNode && layoutNode.children.length) {
        window.roamAlphaAPI.updateBlock({
          block: { uid: layoutNode.children[0].uid, string: key.toLowerCase() },
        });
      } else if (!layoutNode) {
        const uid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          location: { "parent-uid": blockUid, order: 0 },
          block: { string: "layout", uid },
        });
        window.roamAlphaAPI.createBlock({
          location: { "parent-uid": uid, order: 0 },
          block: { string: key.toLowerCase() },
        });
      } else {
        window.roamAlphaAPI.createBlock({
          location: { "parent-uid": layoutNode.uid, order: 0 },
          block: { string: key.toLowerCase() },
        });
      }
      setTimeout(refresh, 1);
    },
    [setLayout, refresh]
  );
  return (
    <>
      <EditContainer
        refresh={refresh}
        blockId={blockId}
        containerStyleProps={{
          backgroundColor: "#CCCCCC",
          width: "100%",
          minWidth: 840,
        }}
        Settings={
          <>
            <Label>
              Tag
              <InputGroup
                value={tagSetting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagSetting(e.target.value)
                }
                onBlur={onTagBlur}
              />
            </Label>
            <BooleanSetting
              blockUid={blockUid}
              refresh={refresh}
              name={"Reverse"}
            />
            <BooleanSetting
              blockUid={blockUid}
              refresh={refresh}
              name={"Creation Date"}
            />
            <BooleanSetting
              blockUid={blockUid}
              refresh={refresh}
              name={"Clean"}
            />
            <Label>
              Layout
              <MenuItemSelect
                items={Object.keys(LAYOUTS)}
                activeItem={Object.keys(LAYOUTS).find(
                  (k) => LAYOUTS[k as keyof typeof LAYOUTS] === layout
                )}
                onItemSelect={onLayoutSelect}
              />
            </Label>
          </>
        }
      >
        <VerticalTimeline
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore types doesn't support left/right
          layout={layout}
        >
          {filteredElements.map((t, i) => (
            <VerticalTimelineElement
              contentStyle={{
                backgroundColor: colors[i % colors.length],
                color: "#fff",
              }}
              contentArrowStyle={{
                borderRight: `7px solid ${colors[i % colors.length]}`,
              }}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore could technically take react node
              date={
                <a
                  href={getRoamUrl(
                    window.roamAlphaAPI.util.dateToPageUid(
                      window.roamAlphaAPI.util.pageTitleToDate(t.date)
                    )
                  )}
                >
                  {t.date}
                </a>
              }
              dateClassName={"roamjs-timeline-date"}
              iconStyle={{
                backgroundColor: colors[i % colors.length],
                color: "#fff",
              }}
              icon={
                <Icon
                  icon="calendar"
                  style={{ height: "100%", width: "100%" }}
                />
              }
              key={`${t.uid}-${t.date}`}
            >
              <h3
                className="vertical-timeline-element-title"
                dangerouslySetInnerHTML={{
                  __html: t.text || "Empty Block",
                }}
              />
              <h4 className="vertical-timeline-element-subtitle">
                <a
                  href={getRoamUrl(t.uid)}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      openBlockInSidebar(t.uid);
                      e.preventDefault();
                    }
                  }}
                >
                  {t.uid}
                </a>
              </h4>
              <p
                className="vertical-timeline-element-body"
                dangerouslySetInnerHTML={{
                  __html: t.body,
                }}
              />
            </VerticalTimelineElement>
          ))}
          {filteredElements.length &&
            (() => {
              const tag = getTag(blockUid);
              const tags = new Set<string>(
                filteredElements.flatMap((t) =>
                  [
                    ...window.roamAlphaAPI.q(
                      `[:find ?t :where [?p :node/title ?t] [?b :block/refs ?p] [?b :block/uid "${t.uid}"]]`
                    ),
                    ...window.roamAlphaAPI.q(
                      `[:find ?t :where [?p :node/title ?t] [?c :block/parents ?b] [?c :block/refs ?p] [?b :block/uid "${t.uid}"]]`
                    ),
                  ].map((s) => s[0] as string)
                )
              );
              tags.delete(tag);
              return (
                <div style={{ position: "absolute", top: 8 }}>
                  <TagFilter
                    blockUid={blockUid}
                    onChange={setFilters}
                    tags={Array.from(tags)}
                  />
                </div>
              );
            })()}
        </VerticalTimeline>
      </EditContainer>
    </>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & TimelineProps): void =>
  ReactDOM.render(<Timeline {...props} />, p);
