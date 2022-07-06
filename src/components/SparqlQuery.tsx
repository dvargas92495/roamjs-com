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
  Checkbox,
  InputGroup,
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
  getTextByBlockUid,
  getPageTitleByBlockUid,
  getUids,
  getShallowTreeByParentUid,
  getTreeByBlockUid,
  getParentUidByBlockUid,
  toRoamDate,
} from "roam-client";
import { extractTag, getCurrentPageUid, toFlexRegex } from "../entry-helpers";
import { getRenderRoot } from "./hooks";
import getSettingIntFromTree from "roamjs-components/util/getSettingIntFromTree";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";

// https://github.com/spamscanner/url-regex-safe/blob/master/src/index.js
const protocol = `(?:(?:[a-z]+:)?//)`;
const host = "(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)";
const domain = "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*";
const tld = `(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})})`;
const port = "(?::\\d{2,5})?";
const path = "(?:[/?#][^\\s\"\\)']*)?";
const regex = `(?:${protocol}|www\\.)(?:${host}${domain}${tld})${port}${path}`;
const URL_REGEX = new RegExp(regex, "ig");

type PageResult = { description: string; id: string; label: string };
const OUTPUT_FORMATS = ["Parent", "Line", "Table"] as const;
export type OutputFormat = typeof OUTPUT_FORMATS[number];
export type RenderProps = {
  textareaRef: { current: HTMLTextAreaElement };
  queriesCache: {
    [uid: string]: {
      query: string;
      source: string;
      outputFormat: OutputFormat;
    };
  };
};

export const DEFAULT_EXPORT_LABEL = "SPARQL Import";
export const getLabel = ({
  outputFormat,
  label,
}: {
  outputFormat: OutputFormat;
  label: string;
}): string =>
  `${label.replace("{date}", new Date().toLocaleString())} ${
    outputFormat === "Table" ? "{{[[table]]}}" : ""
  }`;

const PAGE_QUERY = `SELECT ?property ?propertyLabel ?value ?valueLabel {QUALIFIER_SELECT}{
  VALUES (?id) {(wd:{ID})}
  
  ?id ?p ?statement .
  ?statement ?ps ?value .
  
  ?property wikibase:claim ?p.
  ?property wikibase:statementProperty ?ps.

{QUALIFIER_QUERY}  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} 
ORDER BY ?property ?statement ?value
LIMIT {LIMIT}`;

const WIKIDATA_ITEMS = [
  "Current Page",
  "Current Block",
  "Custom Query",
] as const;
const LIMIT_REGEX = /LIMIT ([\d]*)/;
const IMAGE_REGEX_URL =
  /(http(s?):)([/|.|\w|\s|\-|:|%])*\.(?:jpg|gif|png|svg)/i;
const WIKIDATA_SOURCE = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=";

const combineTextNodes = (nodes: InputTextNode[]) =>
  nodes
    .sort(({ text: a }, { text: b }) => a.localeCompare(b))
    .map((node, i, arr) => {
      const firstIndex = arr.findIndex((n) => n.text === node.text);
      if (i > firstIndex) {
        arr[firstIndex].children.push(...node.children);
        node.text = "";
        node.children = [];
      }
      return node;
    })
    .filter((node) => !!node.text || !!node.children.length)
    .map((node) => {
      node.children = combineTextNodes(node.children);
      return node;
    });

export const runSparqlQuery = ({
  query,
  source,
  parentUid,
  outputFormat,
}: {
  parentUid: string;
} & RenderProps["queriesCache"][string]): Promise<void> =>
  axios.get(`${source}${encodeURIComponent(query)}`).then((r) => {
    const data = r.data.results.bindings as {
      [k: string]: { value: string; type: string };
    }[];
    if (data.length) {
      const head = r.data.head.vars as string[];
      const loadingUid = createBlock({
        node: {
          text: "Loading...",
        },
        parentUid,
      });
      setTimeout(() => {
        const dataLabels = head.filter((h) => !/Label$/.test(h));
        const returnedLabels = new Set(head.filter((h) => /Label$/.test(h)));
        const formatValue = (
          p: { [h: string]: { value: string; type: string } },
          h: string
        ) => {
          const valueKey = returnedLabels.has(`${h}Label`) ? `${h}Label` : h;
          const s = p[valueKey]?.value;
          return !s
            ? ""
            : IMAGE_REGEX_URL.test(s)
            ? `![](${s})`
            : URL_REGEX.test(s)
            ? `[${s}](${s})`
            : returnedLabels.has(`${h}Label`) &&
              /entity\/P\d*$/.test(p[h].value)
            ? `${s}::`
            : /^\d+$/.test(s)
            ? s
            : !isNaN(new Date(s).valueOf())
            ? `[[${toRoamDate(new Date(s))}]]`
            : p[h].type === "uri"
            ? `[[${s}]]`
            : s;
        };
        const output = [
          ...(outputFormat === "Table"
            ? [
                dataLabels
                  .slice()
                  .reverse()
                  .reduce(
                    (prev, cur) => ({
                      text: cur,
                      children: prev.text ? [prev] : [],
                    }),
                    {
                      text: "",
                      children: [] as InputTextNode[],
                    }
                  ),
              ]
            : ([] as InputTextNode[])),
          ...combineTextNodes(
            data.map((p) =>
              outputFormat === "Line"
                ? {
                    text: dataLabels.map((h) => formatValue(p, h)).join(" "),
                    children: [] as InputTextNode[],
                  }
                : dataLabels
                    .slice()
                    .reverse()
                    .reduce(
                      (prev, cur) => ({
                        text: formatValue(p, cur),
                        children: prev.text ? [prev] : [],
                      }),
                      {
                        text: "",
                        children: [] as InputTextNode[],
                      }
                    )
            )
          ),
        ];
        output.forEach((node, order) =>
          createBlock({ node, order, parentUid })
        );
        const titlesSet = new Set(getPageTitleReferencesByPageTitle("same as"));
        setTimeout(() => {
          Object.entries(
            Object.fromEntries(
              data
                .flatMap((p) =>
                  Array.from(returnedLabels)
                    .map((h) => ({
                      link: p[h.replace(/Label$/, "")]?.value,
                      title: p[h]?.value,
                    }))
                    .filter(({ link, title }) => !!link && !!title)
                )
                .filter(
                  ({ title }) =>
                    !titlesSet.has(title) && !IMAGE_REGEX_URL.test(title)
                )
                .map(({ title, link }) => [title, link])
            )
          ).forEach(([title, link]) =>
            createBlock({
              node: {
                text: `same as:: ${link}`,
              },
              parentUid: getPageUidByPageTitle(title),
            })
          );
        }, 1);
      }, 1);
      deleteBlock(loadingUid);
    } else {
      createBlock({
        node: {
          text: "No results found",
        },
        parentUid,
      });
    }
  });

const SparqlQuery = ({
  onClose,
  textareaRef,
  queriesCache,
}: {
  onClose: () => void;
} & RenderProps): React.ReactElement => {
  const configUid = useMemo(() => getPageUidByPageTitle("roam/js/sparql"), []);
  const parentUid = useMemo(getCurrentPageUid, []);
  const pageTitle = useMemo(
    () => getPageTitleByPageUid(parentUid) || getPageTitleByBlockUid(parentUid),
    [parentUid]
  );
  const cursorBlockUid = useMemo(
    () =>
      getTextByBlockUid(parentUid)
        ? parentUid
        : getUids(textareaRef.current).blockUid,
    [parentUid]
  );
  const cursorBlockString = useMemo(
    () => extractTag(getTextByBlockUid(cursorBlockUid)),
    [cursorBlockUid]
  );
  const blockUid = useMemo(
    () =>
      cursorBlockString
        ? cursorBlockUid
        : getParentUidByBlockUid(cursorBlockUid),
    [cursorBlockString, cursorBlockUid]
  );
  const blockString = useMemo(
    () => extractTag(getTextByBlockUid(blockUid)),
    [blockUid]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState<typeof WIKIDATA_ITEMS[number]>(
    WIKIDATA_ITEMS[0]
  );
  const [radioValue, setRadioValue] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const toggleAdditionalOptions = useCallback(
    () => setShowAdditionalOptions(!showAdditionalOptions),
    [setShowAdditionalOptions, showAdditionalOptions]
  );
  const importTree = useMemo(
    () =>
      getTreeByBlockUid(configUid).children.find((t) =>
        toFlexRegex("import").test(t.text)
      )?.children || [],
    [configUid]
  );
  const [label, setLabel] = useState(
    getSettingValueFromTree({
      tree: importTree,
      key: "default label",
      defaultValue: DEFAULT_EXPORT_LABEL,
    })
  );
  const [dataSource, setDataSource] = useState<string>(WIKIDATA_SOURCE);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("Parent");
  const [limit, setLimit] = useState(
    getSettingIntFromTree({
      tree: importTree,
      key: "default limit",
      defaultValue: 10,
    })
  );
  const [saveQuery, setSaveQuery] = useState(false);
  const [importQualifiers, setImportQualifiers] = useState(
    importTree.some((t) => toFlexRegex("qualifiers").test(t.text))
  );
  const query = useMemo(() => {
    if (activeItem === "Current Page" || activeItem === "Current Block") {
      return PAGE_QUERY.replace("{ID}", radioValue)
        .replace("{LIMIT}", `${limit}`)
        .replace(
          "{QUALIFIER_SELECT}",
          importQualifiers
            ? "?qualifierProperty ?qualifierPropertyLabel ?qualifierValue ?qualifierValueLabel "
            : ""
        )
        .replace(
          "{QUALIFIER_QUERY}",
          importQualifiers
            ? `  OPTIONAL {
          ?statement ?pq ?qualifierValue .
          ?qualifierProperty wikibase:qualifier ?pq .
        }
        
`
            : ""
        );
    } else if (activeItem === "Custom Query") {
      if (LIMIT_REGEX.test(codeValue)) {
        return codeValue.replace(
          LIMIT_REGEX,
          (_, l) => `LIMIT ${Math.min(l, limit)}`
        );
      } else {
        return `${codeValue}\nLIMIT ${limit}`;
      }
    }
    return "";
  }, [codeValue, radioValue, activeItem, limit, importQualifiers]);
  const [pageResults, setPageResults] = useState<PageResult[]>([]);
  const searchQuery = useMemo(
    () => (activeItem === "Current Block" ? blockString : pageTitle),
    [activeItem, blockString, pageTitle]
  );
  const dropdownRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    dropdownRef.current?.focus?.();
    if (searchQuery) {
      axios
        .get(
          `https://www.wikidata.org/w/api.php?origin=*&action=wbsearchentities&format=json&limit=5&continue=0&language=en&uselang=en&search=${searchQuery}&type=item`
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
    } else {
      setPageResults([]);
    }
  }, [dropdownRef, setPageResults, searchQuery]);
  const catchImport = useCallback(
    (e: Error) => {
      console.error(e);
      setError(
        "Unknown error occured when querying. Contact support@roamjs.com for help!"
      );
      setLoading(false);
    },
    [setLoading, setError]
  );
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={"SPARQL Import"}
      canEscapeKeyClose
      canOutsideClickClose
    >
      <div className={Classes.DIALOG_BODY}>
        <Label>
          Query Type
          <MenuItemSelect
            items={[...WIKIDATA_ITEMS]}
            onItemSelect={(s) => {
              setActiveItem(s);
              setDataSource(WIKIDATA_SOURCE);
            }}
            activeItem={activeItem}
            ButtonProps={{ elementRef: dropdownRef }}
          />
        </Label>
        {(activeItem === "Current Page" || activeItem === "Current Block") && (
          <>
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
                      <span style={{ fontSize: 10 }}> ({pr.description})</span>
                    </span>
                  }
                />
              ))}
            </RadioGroup>
            {!pageResults.length && (
              <div>No results found for {searchQuery}</div>
            )}
          </>
        )}
        {activeItem === "Custom Query" && (
          <div style={{ marginTop: 16 }} className={"roamjs-sparql-editor"}>
            <CodeMirror
              value={codeValue}
              options={{
                mode: { name: "sparql" },
                lineNumbers: true,
                lineWrapping: true,
              }}
              onBeforeChange={(_, __, v) => setCodeValue(v)}
            />
            <span style={{ marginTop: 8, display: "inline-block" }}>
              <Label>
                SPARQL Endpoint
                <InputGroup
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                />
              </Label>
            </span>
          </div>
        )}
        {showAdditionalOptions && (
          <div style={{ marginTop: 16 }}>
            <Label>
              Label
              <InputGroup
                value={label}
                onChange={(e) => setLabel(e.target.value)}
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
                items={[...OUTPUT_FORMATS]}
                onItemSelect={(s) => setOutputFormat(s)}
              />
            </Label>
            <Checkbox
              label={"Save Query"}
              checked={saveQuery}
              onChange={(e) =>
                setSaveQuery((e.target as HTMLInputElement).checked)
              }
            />
            {activeItem !== "Custom Query" && (
              <Checkbox
                label={"Import Qualifiers"}
                checked={importQualifiers}
                onChange={(e) =>
                  setImportQualifiers((e.target as HTMLInputElement).checked)
                }
              />
            )}
          </div>
        )}
        <style>
          {`.roamjs-sparql-options-toggle {
  cursor: pointer;
  color: blue;
  margin-top: 8px;
  display: inline-block;
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
            disabled={activeItem === "Custom Query" ? !codeValue : !radioValue}
            onClick={() => {
              setLoading(true);
              const importParentUid =
                activeItem === "Current Page" ? parentUid : blockUid;
              const isQuery = activeItem === "Custom Query";
              if (!isQuery) {
                createBlock({
                  parentUid: importParentUid,
                  node: {
                    text: `same as:: http://www.wikidata.org/entity/${radioValue}`,
                  },
                });
              }
              const labelUid = createBlock({
                node: {
                  text: getLabel({ outputFormat, label }),
                },
                parentUid: importParentUid,
                order: isQuery ? 0 : 1,
              });
              const queryInfo = {
                query,
                source: dataSource,
                outputFormat,
              };
              if (saveQuery) {
                const configUid = getPageUidByPageTitle("roam/js/sparql");

                const queriesUid =
                  getShallowTreeByParentUid(configUid).find(({ text }) =>
                    /queries/i.test(text)
                  )?.uid ||
                  createBlock({
                    node: { text: "queries" },
                    parentUid: configUid,
                  });

                createBlock({
                  node: {
                    text: labelUid,
                    children: [
                      { text: query },
                      { text: queryInfo.source },
                      { text: outputFormat },
                    ],
                  },
                  parentUid: queriesUid,
                });
                queriesCache[labelUid] = queryInfo;
              }
              runSparqlQuery({
                ...queryInfo,
                parentUid: labelUid,
              })
                .then(() => {
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

export const render = (props: RenderProps): void => {
  const parent = getRenderRoot("sparql-query");
  ReactDOM.render(
    <SparqlQuery
      {...props}
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default SparqlQuery;
