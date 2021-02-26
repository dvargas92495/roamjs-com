import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import EditContainer from "./EditContainer";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { Icon } from "@blueprintjs/core";
import {
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

const Timeline: React.FunctionComponent<TimelineProps> = ({ blockId }) => {
  const getTimelineElements = useCallback(() => {
    const { blockUid } = getUidsFromId(blockId);
    const tree = getTreeByBlockUid(blockUid);
    const tagNode = tree.children.find((t) => /tag/i.test(t.text));
    if (tagNode && tagNode.children.length) {
      const tag = extractTag(tagNode.children[0].text);
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
            text: text.replace(createTagRegex(tag), "").trim(),
            body: children.reduce(
              (prev, cur) => reduceChildren(prev, cur, 0),
              ""
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
  return (
    <EditContainer
      refresh={refresh}
      blockId={blockId}
      containerStyleProps={{ backgroundColor: "#CCCCCC", width: "200%" }}
    >
      <VerticalTimeline>
        {timelineElements.map((t) => (
          <VerticalTimelineElement
            contentStyle={{ background: "rgb(33, 150, 243)", color: "#fff" }}
            contentArrowStyle={{ borderRight: "7px solid  rgb(33, 150, 243)" }}
            date={t.date}
            iconStyle={{ background: "rgb(33, 150, 243)", color: "#fff" }}
            icon={
              <Icon icon="calendar" style={{ height: "100%", width: "100%" }} />
            }
            key={t.uid}
          >
            <h3 className="vertical-timeline-element-title">{t.text}</h3>
            <h4 className="vertical-timeline-element-subtitle">{t.uid}</h4>
            <p>{t.body}</p>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </EditContainer>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & TimelineProps): void =>
  ReactDOM.render(<Timeline {...props} />, p);
