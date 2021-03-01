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
  getTreeByPageName,
  getUidsFromId,
  parseRoamDate,
  TreeNode,
} from "roam-client";
import {
  createTagRegex,
  DAILY_NOTE_PAGE_REGEX,
  extractTag,
  getTitlesReferencingPagesInSameBlockTree,
  resolveRefs,
} from "../entry-helpers";

type TimelineProps = { blockId: string };

const flatMapper = (t: TreeNode): TreeNode[] => [
  t,
  ...t.children.flatMap(flatMapper),
];

const reduceChildren = (prev: string, cur: TreeNode, l: number): string =>
  `${prev}${"".padEnd(l * 2, " ")}${cur.text}\n${cur.children.reduce(
    (p, c) => reduceChildren(p, c, l + 1),
    ""
  )}`;

const getTag = (blockId: string) => {
  const { blockUid } = getUidsFromId(blockId);
  const tree = getTreeByBlockUid(blockUid);
  const tagNode = tree.children.find((t) => /tag/i.test(t.text));
  if (tagNode && tagNode.children.length) {
    return extractTag(tagNode.children[0].text);
  }
  return "";
};

const Timeline: React.FunctionComponent<TimelineProps> = ({ blockId }) => {
  const getTimelineElements = useCallback(() => {
    const tag = getTag(blockId);
    if (tag) {
      const pages = getTitlesReferencingPagesInSameBlockTree([
        tag,
      ]).filter((t) => DAILY_NOTE_PAGE_REGEX.test(t));
      return pages
        .flatMap((p) => {
          const pageTree = getTreeByPageName(p);
          const nodes = pageTree
            .flatMap(flatMapper)
            .filter((t) => createTagRegex(tag).test(t.text));
          return nodes.map(({ uid, text, children }) => ({
            date: p,
            uid,
            text: resolveRefs(text.replace(createTagRegex(tag), "")).trim(),
            body: resolveRefs(
              children.reduce((prev, cur) => reduceChildren(prev, cur, 0), "")
            ),
          }));
        })
        .sort(
          ({ date: a }, { date: b }) =>
            parseRoamDate(b).valueOf() - parseRoamDate(a).valueOf()
        );
    }
    return [];
  }, [blockId]);
  const [timelineElements, setTimelineElements] = useState(getTimelineElements);
  const refresh = useCallback(() => {
    setTimelineElements(getTimelineElements());
  }, [setTimelineElements, getTimelineElements]);
  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = useCallback(() => setShowSettings(!showSettings), [
    setShowSettings,
    showSettings,
  ]);
  const [tagSetting, setTagSetting] = useState(() => getTag(blockId));
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
        containerStyleProps={{ backgroundColor: "#CCCCCC", width: "175%" }}
      >
        <VerticalTimeline>
          {timelineElements.map((t) => (
            <VerticalTimelineElement
              contentStyle={{ background: "rgb(33, 150, 243)", color: "#fff" }}
              contentArrowStyle={{
                borderRight: "7px solid  rgb(33, 150, 243)",
              }}
              date={t.date}
              iconStyle={{ background: "rgb(33, 150, 243)", color: "#fff" }}
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
              <h4 className="vertical-timeline-element-subtitle">{t.uid}</h4>
              <p>{t.body}</p>
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
