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
} from "roam-client";
import { extractTag, getCurrentPageUid, toFlexRegex } from "../entry-helpers";
import { getRenderRoot } from "./hooks";
import MenuItemSelect from "./MenuItemSelect";
import { getSettingValueFromTree } from "roamjs-components";

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
const getLabel = ({
  outputFormat,
  label,
}: {
  outputFormat: OutputFormat;
  label: string;
}) =>
  `${label.replace("{date}", new Date().toLocaleString())} ${
    outputFormat === "Table" ? "{{[[table]]}}" : ""
  }`;

const PAGE_QUERY = `SELECT ?property ?propertyLabel ?value ?valueLabel {
  VALUES (?id) {(wd:{ID})}
  
  ?id ?p ?statement .
  ?statement ?ps ?value .
  
  ?property wikibase:claim ?p.
  ?property wikibase:statementProperty ?ps.
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} 
ORDER BY ?property ?statement ?value
LIMIT {LIMIT}`;

const WIKIDATA_ITEMS = ["Current Page", "Current Block", "Custom Query"];
const LIMIT_REGEX = /LIMIT ([\d]*)/;
const DATA_SOURCES = {
  wikidata: "https://query.wikidata.org/sparql?format=json&query=",
};
const IMAGE_REGEX_URL = /(http(s?):)([/|.|\w|\s|\-|:|%])*\.(?:jpg|gif|png|svg)/i;

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
          const s = p[valueKey].value;
          return IMAGE_REGEX_URL.test(s)
            ? `![](${s})`
            : returnedLabels.has(`${h}Label`) &&
              /entity\/P\d*$/.test(p[h].value)
            ? `${s}::`
            : p[valueKey].type === "literal"
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
          ...data.map((p) =>
            outputFormat === "Line"
              ? { text: dataLabels.map((h) => formatValue(p, h)).join(" ") }
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
          ),
        ];
        output.forEach((node, order) =>
          createBlock({ node, order, parentUid })
        );
        const titlesSet = new Set(getPageTitleReferencesByPageTitle("same as"));
        setTimeout(() => {
          Array.from(
            new Set(
              data
                .flatMap((p) =>
                  Array.from(returnedLabels).map((h) => ({
                    link: p[h.replace(/Label$/, "")].value,
                    title: p[h].value,
                  }))
                )
                .filter(
                  ({ title }) =>
                    !titlesSet.has(title) && !IMAGE_REGEX_URL.test(title)
                )
            )
          ).forEach(({ title, link }) =>
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
  const cursorBlockString = useMemo(() => extractTag(getTextByBlockUid(cursorBlockUid)), [cursorBlockUid]);
  const blockUid = useMemo(() => cursorBlockString ? cursorBlockUid : getParentUidByBlockUid(cursorBlockUid), [cursorBlockString, cursorBlockUid]);
  const blockString = useMemo(() => extractTag(getTextByBlockUid(blockUid)), [blockUid]);
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
  const [label, setLabel] = useState(
    getSettingValueFromTree({
      tree:
        getTreeByBlockUid(configUid).children.find((t) =>
          toFlexRegex("import").test(t.text)
        )?.children || [],
      key: "default label",
      defaultValue: DEFAULT_EXPORT_LABEL,
    })
  );
  const [dataSource, setDataSource] = useState<keyof typeof DATA_SOURCES>(
    "wikidata"
  );
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("Parent");
  const [limit, setLimit] = useState(10);
  const [saveQuery, setSaveQuery] = useState(false);
  const query = useMemo(() => {
    if (activeItem === "Current Page" || activeItem === "Current Block") {
      return PAGE_QUERY.replace("{ID}", radioValue).replace(
        "{LIMIT}",
        `${limit}`
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
  }, [codeValue, radioValue, activeItem, limit]);
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
              const labelUid = createBlock({
                node: {
                  text: getLabel({ outputFormat, label }),
                },
                parentUid:
                  activeItem === "Current Block" ? blockUid : parentUid,
              });
              const queryInfo = {
                query,
                source: DATA_SOURCES[dataSource],
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
