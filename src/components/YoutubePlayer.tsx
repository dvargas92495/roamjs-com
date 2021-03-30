import { Button, Portal } from "@blueprintjs/core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import YouTube from "react-youtube";
import {
  createBlock,
  getTextByBlockUid,
  getTreeByBlockUid,
  getUids,
  TreeNode,
} from "roam-client";
import { getFirstChildUidByBlockUid, setInputSetting } from "../entry-helpers";
import EditContainer from "./EditContainer";
import { useTree } from "./hooks";
import ToggleIconButton from "./ToggleIconButton";

type YoutubePlayerProps = {
  blockUid: string;
  youtubeId: string;
  blockId: string;
};

const getLoopEdge = (regex: RegExp, children?: TreeNode[]) =>
  (children || []).find((t) => regex.test(t.text))?.children?.[0]?.text;

const getLoopStart = (children?: TreeNode[]) => getLoopEdge(/start/i, children);
const getLoopEnd = (children?: TreeNode[]) => getLoopEdge(/end/i, children);

const YoutubePlayer = ({
  blockUid,
  youtubeId,
  blockId,
}: YoutubePlayerProps): React.ReactElement => {
  const tree = useTree(blockUid);
  const getTimestampNode = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.find((t) =>
        /timestamps/i.test(t.text)
      ),
    [blockUid]
  );
  const initialTimestampNode = useMemo(getTimestampNode, [getTimestampNode]);
  const [timestamps, setTimestamps] = useState(
    (initialTimestampNode?.children || []).map((t) => ({
      uid: t.uid,
      text: t.text,
    }))
  );
  const calcBlocks = useCallback(
    (ts: { uid: string }[]) => {
      const container = document
        .getElementById(blockId)
        .closest(".roam-block-container");
      if (!container) {
        return {};
      }
      const blocks = Array.from(
        container.getElementsByClassName("roam-block")
      ) as HTMLDivElement[];
      return Object.fromEntries(
        ts.map((ts) => [
          ts.uid,
          blocks
            .find((b) => getUids(b).blockUid === ts.uid)
            ?.closest?.(".roam-block-container") as HTMLDivElement,
        ])
      );
    },
    [blockId]
  );
  const blocks = useRef(calcBlocks(timestamps));
  const playerRef = useRef(null);
  const [visibleTimestamp, setVisibleTimestamp] = useState(timestamps[0]?.uid);
  const [start, setStart] = useState(getLoopStart(tree.children));
  const [end, setEnd] = useState(getLoopEnd(tree.children));
  const jumpToStart = useCallback(() => {
    playerRef.current.seekTo(parseInt(getTextByBlockUid(start) || "0"));
  }, [playerRef, start]);
  const onReady = useCallback(
    (e) => {
      playerRef.current = e.target;
      const configEnd = getLoopEnd(getTreeByBlockUid(blockUid).children);
      if (configEnd) {
        setEnd(configEnd);
      }
      jumpToStart();
    },
    [blockUid, jumpToStart, setEnd, playerRef]
  );
  const onMarkerClick = useCallback(() => {
    const time = Math.round(playerRef.current.getCurrentTime());
    const text = time.toString();
    const timestampNode = getTimestampNode();
    if (timestampNode) {
      const index = timestampNode.children.findIndex(
        (t) => parseInt(t.text) > time
      );
      const uid = createBlock({
        node: { text },
        parentUid: timestampNode.uid,
        order: index < 0 ? timestampNode.children.length : index,
      });
      setTimeout(() => {
        const ts = [...timestamps, { text, uid }];
        blocks.current = calcBlocks(ts);
        setTimestamps(ts);
      }, 50);
    } else {
      const uid = createBlock({
        node: { text: "timestamps", children: [{ text }] },
        parentUid: blockUid,
        order: 0,
      });
      setTimeout(() => {
        const childUid = getFirstChildUidByBlockUid(uid);
        const ts = [...timestamps, { text, uid: childUid }];
        blocks.current = calcBlocks(ts);
        setTimestamps(ts);
      }, 50);
    }
  }, [
    playerRef,
    blockUid,
    setStart,
    setEnd,
    getTimestampNode,
    timestamps,
    setTimestamps,
    calcBlocks,
    blocks,
  ]);
  const playerVars = useMemo(
    () => ({
      start: parseInt(getTextByBlockUid(start) || "0"),
      end: parseInt(
        getTextByBlockUid(end) || playerRef.current?.getDuration?.() || "0"
      ),
      origin: window.location.origin,
      autoplay: 0 as const,
    }),
    [start, end]
  );
  return (
    <div style={{ display: "flex" }}>
      <EditContainer containerStyleProps={{ flexGrow: 1 }} blockId={blockId}>
        <YouTube
          videoId={youtubeId}
          opts={{
            width: "100%",
            playerVars,
          }}
          onReady={onReady}
          onEnd={jumpToStart}
        />
      </EditContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 100,
          alignItems: "start",
          paddingLeft: 4,
        }}
      >
        <Button
          icon={"map-marker"}
          minimal
          onClick={onMarkerClick}
          style={{ marginBottom: 32 }}
        />
        {timestamps
          .filter((ts) => !!blocks.current[ts.uid])
          .map((ts) => {
            const container = blocks.current[ts.uid];
            container.addEventListener("mouseenter", () =>
              setVisibleTimestamp(ts.uid)
            );
            return (
              <Portal container={container} key={ts.uid}>
                <span
                  style={{
                    display:
                      ts.uid === visibleTimestamp ? "inline-block" : "none",
                    position: "absolute",
                    top: 0,
                    right: 0,
                  }}
                >
                  <ToggleIconButton
                    icon={"pin"}
                    on={start === ts.uid}
                    onClick={() => {
                      setInputSetting({
                        blockUid,
                        value: ts.uid,
                        key: "start",
                      });
                      setStart(ts.uid);
                    }}
                    style={{ transform: "scale(-1,1)" }}
                  />
                  <ToggleIconButton
                    icon={"pin"}
                    on={end === ts.uid}
                    onClick={() => {
                      setInputSetting({ blockUid, value: ts.uid, key: "end" });
                      setEnd(ts.uid);
                    }}
                  />
                  <Button
                    icon={"play"}
                    minimal
                    onClick={() => {
                      const stamp = parseInt(getTextByBlockUid(ts.uid));
                      playerRef.current.seekTo(stamp);
                      playerRef.current.playVideo();
                    }}
                  />
                  <Button
                    icon={"duplicate"}
                    minimal
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `https://youtube.com/watch?v=${youtubeId}&t=${
                          parseInt(ts.text) || 0
                        }s`
                      )
                    }
                  />
                </span>
              </Portal>
            );
          })}
      </div>
    </div>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLDivElement } & YoutubePlayerProps): void => {
  ReactDOM.render(<YoutubePlayer {...props} />, p);
  const unmountObserver = new MutationObserver((ms) => {
    const parentRemoved = ms
      .flatMap((m) => Array.from(m.removedNodes))
      .some((n) => n.contains(p));
    if (parentRemoved) {
      unmountObserver.disconnect();
      ReactDOM.unmountComponentAtNode(p);
    }
  });
  unmountObserver.observe(document.body, { childList: true, subtree: true });
};

export default YoutubePlayer;
