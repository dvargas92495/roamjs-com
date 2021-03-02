import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import EditContainer from "./EditContainer";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { Button, Icon, InputGroup, Label } from "@blueprintjs/core";
import {
  generateBlockUid,
  getTreeByBlockUid,
  getUidsFromId,
  parseRoamDate,
  toRoamDate,
  toRoamDateUid,
  TreeNode,
} from "roam-client";
import { parseInline } from "roam-marked";
import {
  createTagRegex,
  DAILY_NOTE_PAGE_REGEX,
  DAILY_NOTE_TAG_REGEX,
  extractTag,
  getRoamUrl,
  resolveRefs,
} from "../entry-helpers";

type TimelineProps = { blockId: string };

const reduceChildren = (prev: string, cur: TreeNode, l: number): string =>
  `${prev}<span>${"".padEnd(l * 2, " ")}</span>${parseInline(
    cur.text
  )}<br/>${cur.children.reduce((p, c) => reduceChildren(p, c, l + 1), "")}`;

const getTag = (blockUid: string) => {
  const tree = getTreeByBlockUid(blockUid);
  const tagNode = tree.children.find((t) => /tag/i.test(t.text));
  if (tagNode && tagNode.children.length) {
    return extractTag(tagNode.children[0].text);
  }
  return "";
};

const getColors = (blockUid: string) => {
  const tree = getTreeByBlockUid(blockUid);
  const colorNode = tree.children.find((t) => /colors/i.test(t.text));
  if (colorNode && colorNode.children.length) {
    return colorNode.children.map((c) => c.text);
  }
  return ["#2196f3"];
};

const getReverse = (blockUid: string) => {
  const tree = getTreeByBlockUid(blockUid);
  return tree.children.some((t) => /reverse/i.test(t.text));
};

const getCreationDate = (blockUid: string) => {
  const tree = getTreeByBlockUid(blockUid);
  return tree.children.some((t) => /creation date/i.test(t.text));
};

const Timeline: React.FunctionComponent<TimelineProps> = ({ blockId }) => {
  const { blockUid } = getUidsFromId(blockId);
  const getTimelineElements = useCallback(() => {
    const tag = getTag(blockUid);
    const reverse = getReverse(blockUid);
    const useCreationDate = getCreationDate(blockUid);
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
        .map(([text, pageTitle, uid, creationDate]) => {
          const { children } = getTreeByBlockUid(uid);
          return {
            date: useCreationDate
              ? toRoamDate(new Date(creationDate))
              : DAILY_NOTE_PAGE_REGEX.test(pageTitle)
              ? pageTitle
              : text.match(DAILY_NOTE_TAG_REGEX)[1],
            uid,
            text: resolveRefs(
              text
                .replace(createTagRegex(tag), "")
                .replace(DAILY_NOTE_TAG_REGEX, "")
            ).trim(),
            body: resolveRefs(
              children.reduce((prev, cur) => reduceChildren(prev, cur, 0), "")
            ),
          };
        })
        .sort(({ date: a }, { date: b }) => {
          const bDate = parseRoamDate(b).valueOf();
          const aDate = parseRoamDate(a).valueOf();
          return reverse ? aDate - bDate : bDate - aDate;
        });
    }
    return [];
  }, [blockId]);
  const [timelineElements, setTimelineElements] = useState(getTimelineElements);
  const [colors, setColors] = useState(() => getColors(blockUid));
  const refresh = useCallback(() => {
    setTimelineElements(getTimelineElements());
    setColors(getColors(blockUid));
  }, [
    setTimelineElements,
    getTimelineElements,
    setColors,
    getColors,
    blockUid,
  ]);

  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = useCallback(() => setShowSettings(!showSettings), [
    setShowSettings,
    showSettings,
  ]);
  const [tagSetting, setTagSetting] = useState(() => getTag(blockUid));
  const onTagBlur = useCallback(() => {
    const { blockUid } = getUidsFromId(blockId);
    const tree = getTreeByBlockUid(blockUid);
    const tagNode = tree.children.find((t) => /tag/i.test(t.text));
    if (tagNode && tagNode.children.length) {
      window.roamAlphaAPI.updateBlock({
        block: { uid: tagNode.children[0].uid, string: tagSetting },
      });
    } else if (!tagNode) {
      const uid = generateBlockUid();
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
    setTimeout(() => setTimelineElements(getTimelineElements()), 1);
  }, [blockId, setTimelineElements, getTimelineElements, tagSetting]);
  return (
    <>
      {showSettings && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 3,
            padding: 20,
            border: "1px solid #333333",
          }}
        >
          <h4>Settings:</h4>
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
        </div>
      )}
      <EditContainer
        refresh={refresh}
        blockId={blockId}
        containerStyleProps={{
          backgroundColor: "#CCCCCC",
          width: "100%",
          minWidth: 840,
        }}
      >
        <VerticalTimeline>
          {timelineElements.map((t, i) => (
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
                <a href={getRoamUrl(toRoamDateUid(parseRoamDate(t.date)))}>
                  {t.date}
                </a>
              }
              dateClassName={"roamjs-timeline-date"}
              iconStyle={{ backgroundColor: colors[i % colors.length], color: "#fff" }}
              icon={
                <Icon
                  icon="calendar"
                  style={{ height: "100%", width: "100%" }}
                />
              }
              key={t.uid}
            >
              <h3 className="vertical-timeline-element-title">
                {t.text || "Empty Block"}
              </h3>
              <h4 className="vertical-timeline-element-subtitle">
                <a href={getRoamUrl(t.uid)}>{t.uid}</a>
              </h4>
              <p
                dangerouslySetInnerHTML={{
                  __html: t.body,
                }}
              />
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
        <Button
          icon={"wrench"}
          onClick={toggleSettings}
          style={{
            position: "absolute",
            top: 8,
            right: 88,
            backgroundColor: showSettings
              ? "rgba(115,134,148,0.3)"
              : "transparent",
          }}
          minimal
        />
      </EditContainer>
    </>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & TimelineProps): void =>
  ReactDOM.render(<Timeline {...props} />, p);
