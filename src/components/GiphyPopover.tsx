import { Popover, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { GiphyFetch, GifsResult } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";

const gf = new GiphyFetch(process.env.GIPHY_KEY);

const GiphyPopover: React.FunctionComponent<{
  textarea: HTMLTextAreaElement;
}> = ({ textarea }) => {
  const [fetcher, setFetcher] = useState<() => Promise<GifsResult>>();
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
            setFetcher(() => gf.search(capture));
            return;
          }
        }
      }
      setFetcher(undefined);
    },
    [setFetcher]
  );
  useEffect(() => {
    textarea.addEventListener("input", inputListener);
    return () => {
        textarea.removeEventListener("input", inputListener)
    };
  }, [inputListener]);
  return (
    <Popover
      isOpen={!!fetcher}
      target={<span />}
      position={Position.BOTTOM}
      minimal
      content={
        <Grid width={textarea.offsetWidth} columns={3} fetchGifs={fetcher} onGifsFetchError={console.log} />
      }
    />
  );
};

export const render = (t: HTMLTextAreaElement): void => {
  const parent = document.createElement("div");
  t.parentElement.appendChild(parent);
  parent.style.height = '0';
  ReactDOM.render(<GiphyPopover textarea={t} />, parent);
};

export default GiphyPopover;
