import { Button, Portal } from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import YouTube from "react-youtube";
import {
  createBlock,
  getShallowTreeByParentUid,
  getTextByBlockUid,
  getTreeByBlockUid,
  getUids,
  updateBlock,
} from "roam-client";
import { toFlexRegex } from "../entry-helpers";
import EditContainer from "./EditContainer";
import { renderWithUnmount } from "./hooks";

type YoutubePlayerProps = {
  blockUid: string;
  youtubeId: string;
  blockId: string;
};

const valueToTimestamp = (value: number, duration: number): string => {
  const colons = Math.floor(Math.log(duration) / Math.log(60));
  const parts = [];
  let currentValue = Math.floor(value);
  for (let exp = 0; exp <= colons; exp++) {
    parts.push(currentValue % 60);
    currentValue = Math.floor(currentValue / 60);
  }
  return `${parts
    .reverse()
    .map((s) => `${s}`.padStart(2, "0"))
    .join(":")}.${(value % 1).toFixed(3).substring(2)}`;
};
const timestampToValue = (timestamp: string): number => {
  const timestampOnly = timestamp.split(/[\s|-]/)[0];
  return timestampOnly
    .split(":")
    .map((s) => Number(s))
    .reverse()
    .reduce((prev, cur, i) => prev + cur * Math.pow(60, i), 0);
};

const YoutubePlayer = ({
  blockUid,
  youtubeId,
  blockId,
}: YoutubePlayerProps): React.ReactElement => {
  const latestTimeoutRef = useRef(0);
  const getTimestampNode = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.find((t) =>
        toFlexRegex("timestamps").test(t.text)
      ),
    [blockUid]
  );
  const initialTimestampNode = useMemo(getTimestampNode, [getTimestampNode]);
  const [timestamps, setTimestamps] = useState(
    (initialTimestampNode?.children || []).map((t) => t.uid)
  );
  const [isLoopActive, setIsLoopActive] = useState(
    (initialTimestampNode?.children || []).some((t) => t.text.endsWith(" - "))
  );
  const calcBlocks = useCallback(
    (uids: string[]) => {
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
        uids.map((uid) => [
          uid,
          blocks
            .find((b) => getUids(b).blockUid === uid)
            ?.closest?.(".roam-block-container") as HTMLDivElement,
        ])
      );
    },
    [blockId]
  );
  const timestampBlocks = useRef(calcBlocks(timestamps));
  const playerRef = useRef(null);
  const [visibleTimestamp, setVisibleTimestamp] = useState(timestamps[0]);
  const onReady = useCallback(
    (e) => {
      playerRef.current = e.target;
      const iframe = document.getElementById(
        `roamjs-youtube-${blockUid}`
      ) as HTMLIFrameElement;
      iframe.allow = iframe.allow.replace(" autoplay;", "");
    },
    [blockUid, playerRef]
  );
  const onClick = useCallback(
    (
      writeTimestamp: ({
        children,
        time,
        text,
        parentUid,
      }: {
        children: { text: string; uid: string }[];
        time: number;
        text: string;
        parentUid: string;
      }) => string
    ) => {
      const time = playerRef.current.getCurrentTime();
      const text = valueToTimestamp(time, playerRef.current?.getDuration?.());
      const parentUid =
        getTimestampNode().uid ||
        createBlock({
          node: { text: "timestamps", children: [] },
          parentUid: blockUid,
          order: 0,
        });
      setTimeout(() => {
        const children = getShallowTreeByParentUid(parentUid);
        const uid = writeTimestamp({ children, time, text, parentUid });
        setTimeout(() => {
          const ts = uid ? [...timestamps, uid] : timestamps;
          timestampBlocks.current = calcBlocks(ts);
          setTimestamps(ts);
        }, 50);
      }, 1);
    },
    [
      playerRef,
      blockUid,
      getTimestampNode,
      timestamps,
      setTimestamps,
      calcBlocks,
      timestampBlocks,
    ]
  );
  const onMarkerClick = useCallback(() => {
    onClick(({ children, time, text, parentUid }) => {
      const index = children.findIndex((t) => timestampToValue(t.text) > time);
      return createBlock({
        node: { text },
        parentUid,
        order: index < 0 ? children.length : index,
      });
    });
  }, [onClick]);
  const onLoopClick = useCallback(() => {
    onClick(({ children, time, text, parentUid }) => {
      if (isLoopActive) {
        const node = children.find(
          (t) => timestampToValue(t.text) < time && /-\s*$/.test(t.text)
        );
        if (node) {
          setIsLoopActive(
            children.some((t) => t.uid !== node?.uid && /-\s*$/.test(t.text))
          );
          updateBlock({ text: `${node?.text}${text}`, uid: node?.uid });
        }
        return "";
      } else {
        setIsLoopActive(true);
        const index = children.findIndex(
          (t) => timestampToValue(t.text) > time
        );
        return createBlock({
          node: { text: `${text} - ` },
          parentUid,
          order: index < 0 ? children.length : index,
        });
      }
    });
  }, [onClick, isLoopActive, setIsLoopActive]);
  useEffect(() => {
    return () => clearTimeout(latestTimeoutRef.current);
  }, [latestTimeoutRef]);
  return (
    <div style={{ display: "flex" }}>
      <EditContainer containerStyleProps={{ flexGrow: 1 }} blockId={blockId}>
        <YouTube
          videoId={youtubeId}
          id={`roamjs-youtube-${blockUid}`}
          opts={{
            width: "100%",
            playerVars: {
              origin: window.location.origin,
              autoplay: 0 as const,
              rel: 0 as const,
            },
          }}
          onReady={onReady}
          onPause={() => clearTimeout(latestTimeoutRef.current)}
        />
      </EditContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 40,
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
        <Button
          icon={"refresh"}
          minimal
          onClick={onLoopClick}
          active={isLoopActive}
          style={{ marginBottom: 32 }}
        />
        {timestamps
          .filter((ts) => !!timestampBlocks.current[ts])
          .map((ts) => {
            const container = timestampBlocks.current[ts];
            container.addEventListener("mouseenter", () =>
              setVisibleTimestamp(ts)
            );
            return (
              <Portal container={container} key={ts}>
                <span
                  style={{
                    display: ts === visibleTimestamp ? "inline-block" : "none",
                    position: "absolute",
                    top: 0,
                    right: 0,
                  }}
                >
                  <Button
                    icon={"play"}
                    minimal
                    onClick={() => {
                      clearTimeout(latestTimeoutRef.current);
                      const text = getTextByBlockUid(ts);
                      const stamp = timestampToValue(text);
                      const loopend = /\d\d(?::\d\d){0,2}\.\d\d\d\s*-\s*(\d\d(?::\d\d){0,2}\.\d\d\d)/.exec(
                        text
                      )?.[1];
                      const loop = () => {
                        playerRef.current.seekTo(stamp);
                        playerRef.current.playVideo();
                        if (loopend) {
                          const end = timestampToValue(loopend);
                          latestTimeoutRef.current = window.setTimeout(
                            loop,
                            (end - stamp) * 1000
                          );
                        }
                      };
                      loop();
                    }}
                  />
                  <Button
                    icon={"duplicate"}
                    minimal
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `https://youtube.com/watch?v=${youtubeId}&t=${
                          Math.floor(timestampToValue(getTextByBlockUid(ts))) ||
                          0
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
}: { p: HTMLDivElement } & YoutubePlayerProps): void =>
  renderWithUnmount(<YoutubePlayer {...props} />, p);

export default YoutubePlayer;
