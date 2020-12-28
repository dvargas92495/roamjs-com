import { Popover, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";

const gf = new GiphyFetch(process.env.GIPHY_KEY);

const GiphyPopover: React.FunctionComponent<{
  textarea: HTMLTextAreaElement;
}> = ({ textarea }) => {
  const [search, setSearch] = useState("");
  const fetcher = useCallback(() => gf.search(search), [search]);
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
            setSearch(match[1]);
            return;
          }
        }
      }
      setSearch("");
    },
    [setSearch]
  );
  const blurListener = useCallback(() => setSearch(""), [setSearch]);
  useEffect(() => {
    textarea.addEventListener("input", inputListener);
    textarea.addEventListener("blur", blurListener);
    return () => {
      textarea.removeEventListener("input", inputListener);
      textarea.removeEventListener("blur", blurListener);
    };
  }, [inputListener]);
  return (
    <Popover
      isOpen={!!search}
      target={<span />}
      position={Position.BOTTOM_LEFT}
      minimal
      content={
        <Grid width={textarea.offsetWidth} columns={3} fetchGifs={fetcher} />
      }
    />
  );
};

export const render = (t: HTMLTextAreaElement): void => {
  const parent = document.createElement("div");
  t.parentElement.appendChild(parent);
  parent.style.height = "0";
  ReactDOM.render(<GiphyPopover textarea={t} />, parent);
};

export default GiphyPopover;
