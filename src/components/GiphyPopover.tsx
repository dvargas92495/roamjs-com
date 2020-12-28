import { Popover } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { GiphyFetch, GifsResult } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { getRenderRoot } from "./hooks";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";

const gf = new GiphyFetch(process.env.GIPHY_KEY);

const GiphyPopover: React.FunctionComponent = () => {
  const [fetcher, setFetcher] = useState<() => Promise<GifsResult>>();
  const [targetId, setTargetId] = useState("");
  const inputListener = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const match = textarea.value.match(
          new RegExp(`${PREFIX}(.*)${SUFFIX}`, "s")
        );
        if (match) {
          const { index } = match;
          const full = match[0];
          const cursorPosition = textarea.selectionStart;
          if (
            cursorPosition > index + PREFIX.length &&
            cursorPosition <= index + full.length - SUFFIX.length
          ) {
            const capture = match[1];
            setTargetId;
            setFetcher(() => gf.search(capture));
            return;
          }
        }
      }
      setFetcher(undefined);
    },
    [setFetcher, setTargetId]
  );
  useEffect(() => {
    document.addEventListener("input", inputListener);
    return () => document.removeEventListener("input", inputListener);
  }, [inputListener]);
  return (
    <Popover
      isOpen={!!fetcher}
      target={""}
      content={<Grid width={800} columns={3} fetchGifs={fetcher} />}
      portalContainer={document.getElementById(targetId)}
    />
  );
};

export const render = (): void =>
  ReactDOM.render(<GiphyPopover />, getRenderRoot());

export default GiphyPopover;
