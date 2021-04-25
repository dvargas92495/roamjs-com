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
  Radio,
  RadioGroup,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/sparql/sparql";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import {
  getUidsFromId,
  getTextByBlockUid,
  createBlock,
  getPageTitleByPageUid,
  getPageTitleReferencesByPageTitle,
  getPageUidByPageTitle,
  deleteBlock,
} from "roam-client";
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

type PageResult = { description: string; id: string; label: string };
const PAGE_QUERY = `SELECT ?wd ?wdLabel ?ps_ ?ps_Label {
  VALUES (?id) {(wd:{ID})}
  
  ?id ?p ?statement .
  ?statement ?ps ?ps_ .
  
  ?wd wikibase:claim ?p.
  ?wd wikibase:statementProperty ?ps.
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} ORDER BY ?wd ?statement ?ps_`;

const WIKIDATA_ITEMS = ["Current Page", "Custom Query"];

const WikiData = ({ onClose }: { onClose: () => void }) => {
  const parentUid = useMemo(getCurrentPageUid, []);
  const pageTitle = useMemo(() => getPageTitleByPageUid(parentUid), [
    parentUid,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState(WIKIDATA_ITEMS[0]);
  const [radioValue, setRadioValue] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const query = useMemo(() => {
    if (activeItem === "Current Page") {
      return PAGE_QUERY.replace("{ID}", radioValue);
    } else if (activeItem === "Custom Query") {
      return codeValue;
    }
    return "";
  }, [codeValue, radioValue, activeItem]);
  const [pageResults, setPageResults] = useState<PageResult[]>([]);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    dropdownRef.current?.focus?.();
    axios
      .get(
        `https://www.wikidata.org/w/api.php?origin=*&action=wbsearchentities&format=json&limit=5&continue=0&language=en&uselang=en&search=${pageTitle}&type=item`
      )
      .then((r) =>
        setPageResults(
          r.data.search.map((i: PageResult) => ({
            description: i.description,
            id: i.id,
            label: i.label,
          }))
        )
      );
  }, [dropdownRef, setPageResults]);
  const catchImport = useCallback(
    (e: Error) => {
      console.error(e);
      setError(
        "Unknown error occured when querying wiki data. Contact support@roamjs.com for help!"
      );
      setLoading(false);
    },
    [setLoading, setError]
  );
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
            ButtonProps={{ elementRef: dropdownRef }}
          />
        </Label>
        {activeItem === "Current Page" && (
          <RadioGroup
            onChange={(e) =>
              setRadioValue((e.target as HTMLInputElement).value)
            }
            selectedValue={radioValue}
          >
            {pageResults.map((pr) => (
              <Radio
                key={pr.id}
                value={pr.id}
                labelElement={
                  <span>
                    <b>{pr.label}</b>
                    <span style={{ fontSize: 10 }}>({pr.description})</span>
                  </span>
                }
              />
            ))}
          </RadioGroup>
        )}
        {activeItem === "Custom Query" && (
          <div style={{ marginTop: 16 }}>
            <CodeMirror
              value={codeValue}
              options={{
                mode: { name: "sparql" },
                lineNumbers: true,
                lineWrapping: true,
              }}
              onBeforeChange={(_, __, v) => setCodeValue(v)}
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
                    query
                  )}`
                )
                .then((r) => {
                  const data = r.data.results.bindings.slice(0, 10) as {
                    [k: string]: { value: string };
                  }[];
                  const head = r.data.head.vars as string[];
                  if (activeItem === "Custom Query") {
                    createBlock({
                      node: {
                        text: "Wikidata Import",
                        children: data.map((p, i) => ({
                          text: `Result ${i}`,
                          children: head.map((v) => ({
                            text: v,
                            children: [{ text: p[v].value }],
                          })),
                        })),
                      },
                      parentUid,
                    });
                  } else if (activeItem === "Current Page") {
                    const loadingUid = createBlock({
                      node: {
                        text: "Loading...",
                      },
                      parentUid,
                    });
                    createBlock({
                      node: {
                        text: "Wikidata Import",
                        children: data.map((p) => ({
                          text: `${p["wdLabel"].value}::`,
                          children: [{ text: `[[${p["ps_Label"].value}]]` }],
                        })),
                      },
                      parentUid,
                    });
                    const titlesSet = new Set(
                      getPageTitleReferencesByPageTitle("same as")
                    );
                    data
                      .flatMap((p) => [
                        {
                          link: p["wd"].value,
                          title: p["wdLabel"].value,
                        },
                        { link: p["ps_"].value, title: p["ps_Label"].value },
                      ])
                      .filter(({ title }) => !titlesSet.has(title))
                      .forEach(({ title, link }) =>
                        createBlock({
                          node: {
                            text: `same as:: ${
                              title === pageTitle
                                ? `http://www.wikidata.org/entity/${radioValue}`
                                : link
                            }`,
                          },
                          parentUid: getPageUidByPageTitle(title),
                        })
                      );
                    deleteBlock(loadingUid);
                  }

                  onClose();
                })
                .catch(catchImport);
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
