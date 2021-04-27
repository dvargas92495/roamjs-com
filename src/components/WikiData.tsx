import {
  Button,
  Icon,
  InputGroup,
  Menu,
  MenuItem,
  Popover,
  Spinner,
  Text,
} from "@blueprintjs/core";
import React, {
  useCallback,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import {
  getUidsFromId,
  getTextByBlockUid,
} from "roam-client";
import { useArrowKeyDown } from "./hooks";

const MENUITEM_CLASSNAME = "roamjs-wiki-data-result";

const WikiContent = ({
  blockId,
  closePopover,
}: {
  blockId: string;
  closePopover: () => void;
}) => {
  const [value, setValue] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const onChange = useCallback(
    (e) => {
      setHasSearched(false);
      setResults([]);
      setValue(e.target.value);
    },
    [setValue, setResults, setHasSearched]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const onSearch = useCallback(() => {
    setError("");
    setLoading(true);
    axios
      .get(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=&list=search&srsearch=${encodeURIComponent(
          value
        )}&srprop=titlesnippet&srsort=relevance&origin=*`
      )
      .then((r) => {
        const titles = r.data.query.search.map(
          (s: { title: string }) => s.title
        );
        setResults(titles);
        inputRef.current.focus();
      })
      .catch((e) => setError(e.response?.data || e.message))
      .finally(() => {
        setHasSearched(true);
        setLoading(false);
      });
  }, [value, setLoading, setHasSearched, setResults, inputRef]);
  const onMenuItem = useCallback(
    (title: string) => {
      setError("");
      setLoading(true);
      setResults([]);
      axios
        .get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            title
          )}`
        )
        .then(async (r) => {
          const { blockUid } = getUidsFromId(blockId);
          const { extract } = r.data;
          const text = getTextByBlockUid(blockUid);
          window.roamAlphaAPI.updateBlock({
            block: {
              uid: blockUid,
              string: text.replace(/{{wiki(-data)?}}/i, extract),
            },
          });
          closePopover();
        })
        .catch((e) => {
          setError(e.response?.data || e.message);
          setLoading(false);
        });
    },
    [setError, setLoading, closePopover, setResults]
  );
  const { activeIndex, onKeyDown } = useArrowKeyDown({
    onEnter: onMenuItem,
    results,
  });
  return (
    <div style={{ padding: 16 }}>
      <div>
        <InputGroup
          leftElement={<Icon icon="search" />}
          onChange={onChange}
          placeholder="Search Wiki..."
          rightElement={
            <Button
              text={"Search"}
              onClick={onSearch}
              style={{
                margin: 0,
                height: 30,
                borderTopRightRadius: 15,
                borderBottomRightRadius: 15,
              }}
            />
          }
          value={value}
          autoFocus={true}
          type={"search"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length === 0) {
              onSearch();
            } else {
              onKeyDown(e);
            }
          }}
          inputRef={inputRef}
        />
      </div>
      {hasSearched && (
        <div>
          {loading && <Spinner />}
          {error && <Text>{error}</Text>}
          {results.length === 0 && !loading && !error && (
            <Text>No Results Found.</Text>
          )}
          <Menu>
            {results.map((r, i) => (
              <MenuItem
                text={r}
                active={i === activeIndex}
                key={i}
                onClick={() => onMenuItem(r)}
                className={MENUITEM_CLASSNAME}
              />
            ))}
          </Menu>
        </div>
      )}
    </div>
  );
};

const Wikipedia = ({
  blockId,
  defaultIsOpen,
}: {
  blockId: string;
  defaultIsOpen: boolean;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      content={<WikiContent blockId={blockId} closePopover={close} />}
      target={<Button text="WIKI" onClick={open} data-roamjs-wiki-data />}
      isOpen={isOpen}
      onInteraction={(s, e) => {
        if (
          !e ||
          ((e.target as HTMLElement).className.indexOf(MENUITEM_CLASSNAME) <
            0 &&
            !(e.target as HTMLElement).getElementsByClassName(
              MENUITEM_CLASSNAME
            ).length &&
            (e.target as HTMLElement).id !== blockId)
        ) {
          setIsOpen(s);
        }
      }}
    />
  );
};

export const renderWikipedia = (blockId: string, p: HTMLElement): void =>
  ReactDOM.render(<Wikipedia blockId={blockId} defaultIsOpen={true} />, p);

export default Wikipedia;
