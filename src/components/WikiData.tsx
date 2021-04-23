import {
  Button,
  Classes,
  Dialog,
  Icon,
  InputGroup,
  Label,
  Menu,
  MenuItem,
  Popover,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/sparql/sparql";
import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { getUidsFromId, getTextByBlockUid, createBlock } from "roam-client";
import { getRenderRoot, useArrowKeyDown } from "./hooks";
import MenuItemSelect from "./MenuItemSelect";
import { getCurrentPageUid } from "../entry-helpers";

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

const WIKIDATA_ITEMS = ["Current Page", "Block on Page", "Custom Query"];
const WikiData = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState(WIKIDATA_ITEMS[0]);
  const [value, setValue] = useState("");
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={"Import Wiki Data"}
      canEscapeKeyClose
      canOutsideClickClose
    >
      <div className={Classes.DIALOG_BODY}>
        <Label>
          Query Type
          <MenuItemSelect
            items={WIKIDATA_ITEMS}
            onItemSelect={(s) => setActiveItem(s)}
            activeItem={activeItem}
            ButtonProps={{ autoFocus: true }}
          />
        </Label>
        {activeItem === "Custom Query" && (
          <div style={{ marginTop: 16 }}>
            <CodeMirror
              value={value}
              options={{
                mode: { name: "sparql" },
                lineNumbers: true,
                lineWrapping: true,
              }}
              onBeforeChange={(_, __, v) => setValue(v)}
            />
          </div>
        )}
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <span style={{ color: "darkred" }}>{error}</span>
          {loading && <Spinner size={Spinner.SIZE_SMALL} />}
          <Button
            text={"Import"}
            onClick={() => {
              setLoading(true);
              axios
                .get(
                  `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(
                    value
                  )}`
                )
                .then((r) => {
                  const data = r.data.results.bindings as {
                    [k: string]: { value: string };
                  }[];
                  const head = r.data.head.vars as string[];
                  createBlock({
                    node: {
                      text: "Wikidata Import",
                      children: data.slice(0, 10).map((p) => ({
                        text: p[head[0]].value,
                        children: head.slice(1).map((v) => ({
                          text: v,
                          children: [{ text: p[v].value }],
                        })),
                      })),
                    },
                    parentUid: getCurrentPageUid(),
                    order: 0,
                  });

                  onClose();
                })
                .catch((e) => {
                  console.error(e);
                  setError(
                    "Unknown error occured when querying wiki data. Contact support@roamjs.com for help!"
                  );
                  setLoading(false);
                });
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const renderWikipedia = (blockId: string, p: HTMLElement): void =>
  ReactDOM.render(<Wikipedia blockId={blockId} defaultIsOpen={true} />, p);

export const renderWikiData = (): void => {
  const parent = getRenderRoot("wiki-data");
  ReactDOM.render(
    <WikiData
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default Wikipedia;
