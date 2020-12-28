import { Popover, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { IGif } from "@giphy/js-types";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Carousel } from "@giphy/react-components";
import { asyncPaste, asyncType, openBlock } from "roam-client";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";

const gf = new GiphyFetch(process.env.GIPHY_KEY);

const GiphyPopover: React.FunctionComponent<{
  textarea: HTMLTextAreaElement;
}> = ({ textarea }) => {
  // const [search, setSearch] = useState("");
  const [initialGifs, setInitialGifs] = useState<IGif[]>();
  //const fetcher = useCallback(() => gf.search(search), [search]);
  const onGifClick = useCallback(
    async (gif: IGif, e: React.SyntheticEvent<HTMLElement, Event>) => {
      await openBlock(textarea);
      const match = textarea.value.match(
        new RegExp(`${PREFIX}(.*)${SUFFIX}`, "s")
      );
      textarea.setSelectionRange(match.index, match.index + match[0].length);
      await asyncType("{backspace}");
      await asyncPaste(`![${gif.title}](${gif.images.original.url})`);
      e.stopPropagation();
      e.preventDefault();
    },
    [textarea]
  );
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
            gf.search(match[1]).then(v => setInitialGifs(v.data));
            return;
          }
        }
      }
      setInitialGifs(undefined);
    },
    [setInitialGifs]
  );
  useEffect(() => {
    textarea.addEventListener("input", inputListener);
    return () => {
      textarea.removeEventListener("input", inputListener);
      Array.from(
        document.getElementsByClassName("roamjs-giphy-portal")
      ).forEach((p) => p.parentElement.parentElement.removeChild(p.parentElement));
    };
  }, [inputListener]);
  return (
    <Popover
      isOpen={!!initialGifs}
      target={<span />}
      position={Position.BOTTOM_LEFT}
      minimal
      content={
        <div style={{ width: textarea.offsetWidth }}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
          {/*@ts-ignore fetchGifs should be optional*/ }
          <Carousel
            gifHeight={200}
            noResultsMessage={`No GIFs found`}
            //fetchGifs={fetcher}
            initialGifs={initialGifs}
            onGifClick={onGifClick}
          />
        </div>
      }
      portalClassName={"roamjs-giphy-portal"}
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
