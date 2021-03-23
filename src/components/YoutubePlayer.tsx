import { Button } from "@blueprintjs/core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import YouTube from "react-youtube";
import { createBlock, getTreeByBlockUid } from "roam-client";

type YoutubePlayerProps = {
  blockUid: string;
  youtubeId: string;
};

const YoutubePlayer = ({
  blockUid,
  youtubeId,
}: YoutubePlayerProps): React.ReactElement => {
  const initialLoopNode = useMemo(
    () =>
      getTreeByBlockUid(blockUid).children.find((t) => /loop/i.test(t.text)),
    [blockUid]
  );
  const playerRef = useRef(null);
  const [start, setStart] = useState(
    parseInt(initialLoopNode?.children?.[0]?.text || "0")
  );
  const [end, setEnd] = useState(
    parseInt(initialLoopNode?.children?.[1]?.text || "0")
  );
  const onReady = useCallback(
    (e) => {
      playerRef.current = e.target;
      const configEnd = getTreeByBlockUid(blockUid).children.find((t) =>
        /loop/i.test(t.text)
      )?.children?.[1]?.text;
      if (configEnd) {
        setEnd(parseInt(configEnd));
      } else {
        setEnd(e.target.getDuration());
      }
      e.target.seekTo(start);
    },
    [blockUid, start, setEnd, playerRef]
  );
  const onEnd = useCallback(() => {
    playerRef.current.seekTo(start);
  }, [playerRef, start]);
  const onMarkerClick = useCallback(() => {
    const time = Math.round(playerRef.current.getCurrentTime());
    const text = time.toString();
    const config = getTreeByBlockUid(blockUid).children;
    const loopNode = config.find((t) => /loop/i.test(t.text));
    if (loopNode) {
      createBlock({
        node: { text },
        parentUid: loopNode.uid,
        order: loopNode.children.length,
      });
      if (loopNode.children.length % 2 === 1) {
        playerRef.current.seekTo(start);
        setEnd(time);
      } else {
        setStart(time);
      }
    } else {
      createBlock({
        node: { text: "loop", children: [{ text }] },
        parentUid: blockUid,
        order: 0,
      });
      setStart(time);
    }
  }, [playerRef, blockUid, setStart, setEnd]);
  return (
    <div style={{ display: "flex" }}>
      <YouTube
        videoId={youtubeId}
        opts={{
          width: "512px",
          height: "312px",
          playerVars: {
            start,
            end,
            origin: window.location.origin,
          },
        }}
        onReady={onReady}
        onEnd={onEnd}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Button icon={"map-marker"} minimal onClick={onMarkerClick} />
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
