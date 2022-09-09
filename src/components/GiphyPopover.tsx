import { Popover, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { IGif } from "@giphy/js-types";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Carousel } from "@giphy/react-components";
import getUids from "roamjs-components/dom/getUids";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";
const GIPHY_REGEX = new RegExp(`${PREFIX}(.*)${SUFFIX}`, "si");

const gf = new GiphyFetch(process.env.GIPHY_KEY);
const getMatch = (textarea: HTMLTextAreaElement) =>
  textarea.value.match(GIPHY_REGEX);

const GiphyPopover: React.FunctionComponent<{
  textarea: HTMLTextAreaElement;
}> = ({ textarea }) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useCallback(() => gf.search(search), [search]);
  const onGifClick = useCallback(
    async (gif: IGif, e: React.SyntheticEvent<HTMLElement, Event>) => {
      const { blockUid } = getUids(textarea);
      const value = getTextByBlockUid(blockUid);
      const newValue = value.replace(
        GIPHY_REGEX,
        `![${gif.title}](${gif.images.original.url})`
      );
      window.roamAlphaAPI.updateBlock({
        block: { string: newValue, uid: blockUid },
      });
      e.stopPropagation();
      e.preventDefault();
      setIsOpen(false);
    },
    [textarea, setIsOpen]
  );
  const inputListener = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const match = getMatch(textarea);
        if (match) {
          const { index } = match;
          const full = match[0];
          const cursorPosition = textarea.selectionStart;
          if (
            cursorPosition > index + PREFIX.length &&
            cursorPosition <= index + full.length - SUFFIX.length
          ) {
            setSearch(match[1]);
            setIsOpen(!!match[1]);
            return;
          }
        }
      }
      setSearch("");
      setIsOpen(false);
    },
    [setSearch, setIsOpen]
  );
  useEffect(() => {
    textarea.addEventListener("input", inputListener);
    return () => {
      textarea.removeEventListener("input", inputListener);
    };
  }, [inputListener]);
  return (
    <Popover
      isOpen={isOpen}
      target={<span />}
      position={Position.BOTTOM_LEFT}
      minimal
      content={
        <div style={{ width: textarea.offsetWidth }} key={search}>
          <Carousel
            gifHeight={200}
            noResultsMessage={`No GIFs found`}
            fetchGifs={fetcher}
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
