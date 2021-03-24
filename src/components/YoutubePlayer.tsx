import { Button } from "@blueprintjs/core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import YouTube from "react-youtube";
import {
  createBlock,
  getTextByBlockUid,
  getTreeByBlockUid,
  TreeNode,
} from "roam-client";
import { getFirstChildUidByBlockUid, setInputSetting } from "../entry-helpers";
import EditContainer from "./EditContainer";
import { useTree } from "./hooks";
import ToggleIconButton from "./ToggleIconButton";

type YoutubePlayerProps = {
  blockUid: string;
  youtubeId: string;
};

const getLoopEdge = (regex: RegExp, children?: TreeNode[]) =>
  (children || []).find((t) => regex.test(t.text))?.children?.[0]?.text;

const getLoopStart = (children?: TreeNode[]) => getLoopEdge(/start/i, children);
const getLoopEnd = (children?: TreeNode[]) => getLoopEdge(/end/i, children);
const formatSeconds = (s: string, max: number) => {
  const seconds = parseInt(s);
  const rest = s.substring(`${s}`.length);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${max >= 3600 ? `${`${hours % 60}`.padStart(2, "0")}:` : ""}${
    max >= 60 ? `${`${minutes % 60}`.padStart(2, "0")}:` : ""
  }${`${seconds % 60}`.padStart(2, "0")}${rest}`;
};

const YoutubePlayer = ({
  blockUid,
  youtubeId,
}: YoutubePlayerProps): React.ReactElement => {
  const tree = useTree(blockUid);
  const [max, setMax] = useState(0);
  const getTimestampNode = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.find((t) =>
        /timestamps/i.test(t.text)
      ),
    [blockUid]
  );
  const initialTimestampNode = useMemo(getTimestampNode, [getTimestampNode]);
  const playerRef = useRef(null);
  const [timestamps, setTimestamps] = useState(
    (initialTimestampNode?.children || []).map((t) => ({
      uid: t.uid,
      text: t.text,
    }))
  );
  const [start, setStart] = useState(getLoopStart(tree.children));
  const [end, setEnd] = useState(getLoopEnd(tree.children));
  const jumpToStart = useCallback(
    () => playerRef.current.seekTo(parseInt(getTextByBlockUid(start) || "0")),
    [playerRef, start]
  );
  const onReady = useCallback(
    (e) => {
      playerRef.current = e.target;
      const configEnd = getLoopEnd(getTreeByBlockUid(blockUid).children);
      if (configEnd) {
        setEnd(configEnd);
      }
      jumpToStart();
      setMax(e.target.getDuration());
    },
    [blockUid, jumpToStart, setEnd, playerRef, setMax]
  );
  const onMarkerClick = useCallback(() => {
    const time = Math.round(playerRef.current.getCurrentTime());
    const text = time.toString();
    const timestampNode = getTimestampNode();
    if (timestampNode) {
      const uid = createBlock({
        node: { text },
        parentUid: timestampNode.uid,
        order: timestampNode.children.length,
      });
      setTimestamps([...timestamps, { text, uid }]);
    } else {
      const uid = createBlock({
        node: { text: "timestamps", children: [{ text }] },
        parentUid: blockUid,
        order: 0,
      });
      setTimeout(() => {
        const childUid = getFirstChildUidByBlockUid(uid);
        setTimestamps([...timestamps, { text, uid: childUid }]);
      }, 1);
    }
  }, [
    playerRef,
    blockUid,
    setStart,
    setEnd,
    getTimestampNode,
    timestamps,
    setTimestamps,
  ]);
  const playerVars = useMemo(
    () => ({
      start: parseInt(getTextByBlockUid(start) || "0"),
      end: parseInt(
        getTextByBlockUid(end) || playerRef.current?.getDuration?.() || "0"
      ),
      origin: window.location.origin,
    }),
    [start, end]
  );
  return (
    <div style={{ display: "flex" }}>
      <EditContainer containerStyleProps={{ flexGrow: 1 }}>
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
        <h5>Timestamps</h5>
        {timestamps.map((ts) => (
          <div
            style={{ display: "flex", justifyContent: "space-between" }}
            key={ts.uid}
          >
            <code style={{ display: "inline-block" }}>
              {formatSeconds(ts.text, max)}
            </code>
            <span style={{ display: "inline-block" }}>
              <ToggleIconButton
                icon={"pin"}
                on={start === ts.uid}
                onClick={() => {
                  setInputSetting({ blockUid, value: ts.uid, key: "start" });
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
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLDivElement } & YoutubePlayerProps): void =>
  ReactDOM.render(<YoutubePlayer {...props} />, p);

export default YoutubePlayer;
