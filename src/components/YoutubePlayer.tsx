import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import YouTube from "react-youtube";
import { getTreeByBlockUid } from "roam-client";

type YoutubePlayerProps = {
  blockUid: string;
  youtubeId: string;
};

const YoutubePlayer = ({
  blockUid,
  youtubeId,
}: YoutubePlayerProps): React.ReactElement => {
  const playerRef = useRef(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const onReady = useCallback(
    (e) => {
      playerRef.current = e.target;
      const config = getTreeByBlockUid(blockUid).children;
      const configStart = config.find((t) => /loop start/i.test(t.text))
        ?.children?.[0]?.text;
      if (configStart) {
        setStart(parseFloat(configStart));
      } else {
        setStart(0);
      }
      const configEnd = config.find((t) => /loop end/i.test(t.text))
        ?.children?.[0]?.text;
      if (configEnd) {
        setEnd(parseFloat(configEnd));
      } else {
        setEnd(e.target.getDuration());
      }
    },
    [blockUid, setStart, setEnd, playerRef]
  );
  const onEnd = useCallback(() => {
    playerRef.current.seekTo(start);
  }, [playerRef, start]);
  return (
    <YouTube
      videoId={youtubeId}
      opts={{ width: "512px", height: "312px", playerVars: { start, end } }}
      onReady={onReady}
      onEnd={onEnd}
    />
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLDivElement } & YoutubePlayerProps): void =>
  ReactDOM.render(<YoutubePlayer {...props} />, p);

export default YoutubePlayer;
