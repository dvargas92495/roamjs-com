import {
  Dialog,
  Classes,
  Label,
  RadioGroup,
  Radio,
  Spinner,
  Button,
  NumericInput,
  Icon,
} from "@blueprintjs/core";
import axios from "axios";
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
import {
  getPageTitleByPageUid,
  createBlock,
  getPageTitleReferencesByPageTitle,
  getPageUidByPageTitle,
  deleteBlock,
  InputTextNode,
} from "roam-client";
import { getCurrentPageUid } from "../entry-helpers";
import { getRenderRoot } from "./hooks";
import MenuItemSelect from "./MenuItemSelect";

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
const DATA_SOURCES = {
  wikidata: "https://query.wikidata.org/sparql?format=json&query=",
};
const OUTPUT_FORMATS = ["Parent", "Line", "Table"];

const SparqlQuery = ({
  onClose,
}: {
  onClose: () => void;
}): React.ReactElement => {
  const parentUid = useMemo(getCurrentPageUid, []);
  const pageTitle = useMemo(() => getPageTitleByPageUid(parentUid), [
    parentUid,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState(WIKIDATA_ITEMS[0]);
  const [radioValue, setRadioValue] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const toggleAdditionalOptions = useCallback(
    () => setShowAdditionalOptions(!showAdditionalOptions),
    [setShowAdditionalOptions, showAdditionalOptions]
  );
  const [dataSource, setDataSource] = useState<keyof typeof DATA_SOURCES>(
    "wikidata"
  );
  const [outputFormat, setOutputFormat] = useState("Parent");
  const [limit, setLimit] = useState(10);
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
        {showAdditionalOptions && (
          <>
            <Label>
              Data Source
              <MenuItemSelect
                activeItem={dataSource}
                items={
                  Object.keys(DATA_SOURCES) as (keyof typeof DATA_SOURCES)[]
                }
                onItemSelect={(s) => setDataSource(s)}
              />
            </Label>
            <Label>
              Limit
              <NumericInput value={limit} onValueChange={setLimit} />
            </Label>
            <Label>
              Output Format
              <MenuItemSelect
                activeItem={outputFormat}
                items={OUTPUT_FORMATS}
                onItemSelect={(s) => setOutputFormat(s)}
              />
            </Label>
          </>
        )}
        <style>
          {`.roamjs-sparql-options-toggle {
  cursor: pointer;
  color: blue;
  margin-top: 8px;
}

.roamjs-sparql-options-toggle:hover {
    text-decoration: 'underline';
  }`}
        </style>
        <span
          className={"roamjs-sparql-options-toggle"}
          onClick={toggleAdditionalOptions}
        >
          <Icon icon={showAdditionalOptions ? "caret-up" : "caret-down"} />
          {showAdditionalOptions ? "Hide" : "Show"} additional options
        </span>
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
                .get(`${DATA_SOURCES[dataSource]}${encodeURIComponent(query)}`)
                .then((r) => {
                  const data = r.data.results.bindings.slice(0, limit) as {
                    [k: string]: { value: string };
                  }[];
                  const head = r.data.head.vars as string[];
                  if (activeItem === "Custom Query") {
                    createBlock({
                      node: {
                        text:
                          outputFormat === "Table"
                            ? "{{[[table]]}}"
                            : "Wikidata Import",
                        children: [
                          ...(outputFormat === "Table"
                            ? [
                                head
                                  .slice(0, head.length - 1)
                                  .reverse()
                                  .reduce(
                                    (prev, cur) => ({
                                      text: cur,
                                      children: [prev],
                                    }),
                                    {
                                      text: head[head.length - 1],
                                      children: [] as InputTextNode[],
                                    }
                                  ),
                              ]
                            : ([] as InputTextNode[])),
                          ...data.map((p, i) =>
                            outputFormat === "Table"
                              ? head
                                  .slice(0, head.length - 1)
                                  .reverse()
                                  .reduce(
                                    (prev, cur) => ({
                                      text: p[cur].value,
                                      children: [prev],
                                    }),
                                    {
                                      text: p[head[head.length - 1]].value,
                                      children: [] as InputTextNode[],
                                    }
                                  )
                              : outputFormat === "Parent"
                              ? {
                                  text: `Result ${i}`,
                                  children: head.map((v) => ({
                                    text: v,
                                    children: [{ text: p[v].value }],
                                  })),
                                }
                              : {
                                  text: `Result ${i}`,
                                  children: head.map((v) => ({
                                    text: `${v}:: ${p[v].value}`,
                                  })),
                                }
                          ),
                        ],
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
                        text:
                          outputFormat === "Table"
                            ? "{{[[table]]}}"
                            : "Wikidata Import",
                        children: [
                          ...(outputFormat === "Table"
                            ? [
                                {
                                  text: "property",
                                  children: [{ text: "value" }],
                                },
                              ]
                            : []),
                          ...data.map((p) => ({
                            text: `${p["wdLabel"].value}::${
                              outputFormat === "Line"
                                ? `[[${p["ps_Label"].value}]]`
                                : ""
                            }`,
                            children:
                              outputFormat === "Line"
                                ? []
                                : [{ text: `[[${p["ps_Label"].value}]]` }],
                          })),
                        ],
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

export const render = (): void => {
  const parent = getRenderRoot("sparql-query");
  ReactDOM.render(
    <SparqlQuery
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default SparqlQuery;
