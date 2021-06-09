import { Button, Popover, Tooltip } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import {
  createBlock,
  deleteBlock,
  getShallowTreeByParentUid,
} from "roam-client";
import { addInputSetting } from "roamjs-components";
import { toFlexRegex } from "../entry-helpers";

const TagFilter = ({
  blockUid,
  onChange,
  tags,
}: {
  blockUid: string;
  tags: string[];
  onChange: (val: { includes: string[]; excludes: string[] }) => void;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterNodeUid, setFilterNodeUid] = useState(
    getShallowTreeByParentUid(blockUid).find((t) =>
      toFlexRegex("filter").test(t.text)
    )?.uid
  );
  const filterChildren = useMemo(
    () => (filterNodeUid ? getShallowTreeByParentUid(filterNodeUid) : []),
    [filterNodeUid]
  );
  const includeUid = useMemo(
    () => filterChildren.find((t) => toFlexRegex("includes").test(t.text))?.uid,
    [filterChildren]
  );
  const excludeUid = useMemo(
    () => filterChildren.find((t) => toFlexRegex("excludes").test(t.text))?.uid,
    [filterChildren]
  );
  const initialIncludes = useMemo(
    () => (includeUid ? getShallowTreeByParentUid(includeUid) : []),
    [includeUid]
  );
  const initialExcludes = useMemo(
    () => (excludeUid ? getShallowTreeByParentUid(excludeUid) : []),
    [excludeUid]
  );
  const [includes, setIncludes] =
    useState<{ text: string; uid: string }[]>(initialIncludes);
  const [excludes, setExcludes] =
    useState<{ text: string; uid: string }[]>(initialExcludes);
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (initialIncludes.length || initialExcludes.length) {
      onChange({
        includes: initialIncludes.map(({ text }) => text),
        excludes: initialExcludes.map(({ text }) => text),
      });
    }
  }, [onChange, initialIncludes, initialExcludes]);
  const chosenSet = useMemo(() => {
    const chosen = new Set();
    includes.forEach(({ text }) => chosen.add(text));
    excludes.forEach(({ text }) => chosen.add(text));
    return chosen;
  }, [includes, excludes]);
  return (
    <Popover
      target={
        <Tooltip content={"Filter this timeline"}>
          <Button icon={"filter"} onClick={() => setIsOpen(!isOpen)} minimal />
        </Tooltip>
      }
      content={
        <div style={{ maxWidth: 600, maxHeight: 245, overflowY: "scroll" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 500,
              maxWidth: "90vw",
              transition: "all 300ms ease-in 0s",
              padding: 8,
            }}
          >
            <div className="flex-h-box">
              <div
                style={{
                  flex: "1 1 100%",
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 4,
                }}
              >
                <div>
                  <strong>Includes</strong>
                  <span style={{ marginLeft: 4, fontSize: 12 }}>
                    Click to Add
                  </span>
                  {includes.length ? (
                    <div style={{ paddingTop: 8 }}>
                      {includes.map((inc) => (
                        <div
                          key={inc.uid}
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <div>
                            <button
                              className="bp3-button"
                              style={{
                                margin: 4,
                                paddingRight: 4,
                                cursor: "pointer",
                                borderBottomColor: "rgb(92, 112, 128)",
                                fontSize: "1.3em",
                              }}
                              onClick={() => {
                                const newVals = includes.filter(
                                  (i) => i.uid != inc.uid
                                );
                                setIncludes(newVals);
                                onChange({
                                  includes: newVals.map(({ text }) => text),
                                  excludes: excludes.map(({ text }) => text),
                                });
                                deleteBlock(inc.uid);
                              }}
                            >
                              {inc.text}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "8px 0px",
                        fontSize: "0.8em",
                        color: "rgb(167, 182, 194)",
                      }}
                    >
                      Only include block paths with these links in them
                    </div>
                  )}
                </div>
                <div style={{ paddingTop: 8 }} />
              </div>
              <div
                className="rm-line"
                style={{ marginTop: 8, marginBottom: 8 }}
              />
              <div
                style={{
                  flex: "1 1 100%",
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 4,
                }}
              >
                <div>
                  <strong>Removes</strong>
                  <span style={{ marginLeft: 4, fontSize: 12 }}>
                    Shift-Click to Add
                  </span>
                  {excludes.length ? (
                    <div style={{ paddingTop: 8 }}>
                      {excludes.map((exc) => (
                        <div
                          key={exc.uid}
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <div>
                            <button
                              className="bp3-button"
                              style={{
                                margin: 4,
                                paddingRight: 4,
                                cursor: "pointer",
                                borderBottomColor: "rgb(92, 112, 128)",
                                fontSize: "1.3em",
                              }}
                              onClick={() => {
                                const newVals = excludes.filter(
                                  (i) => i.uid != exc.uid
                                );
                                setExcludes(newVals);
                                onChange({
                                  includes: includes.map(({ text }) => text),
                                  excludes: newVals.map(({ text }) => text),
                                });
                                deleteBlock(exc.uid);
                              }}
                            >
                              {exc.text}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "8px 0px",
                        fontSize: "0.8em",
                        color: "rgb(167, 182, 194)",
                      }}
                    >
                      Hide blocks with these links in them, and all blocks
                      nested below them
                    </div>
                  )}
                </div>
                <div style={{ paddingTop: 8 }} />
              </div>
            </div>
            <div
              className="rm-line"
              style={{ marginTop: 4, borderColor: "rgb(41, 55, 66)" }}
            ></div>
            {!includes.length && !excludes.length && (
              <input
                placeholder="Search References"
                className="bp3-input bp3-minimal search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ margin: 8 }}
              />
            )}
            <div>
              {tags
                .filter((t) => !chosenSet.has(t))
                .map((tag) => (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                    key={tag}
                  >
                    <div>
                      <button
                        className="bp3-button"
                        style={{
                          margin: 4,
                          paddingRight: 4,
                          cursor: "pointer",
                          borderBottomColor: "rgb(92, 112, 128)",
                          fontSize: "1.3em",
                        }}
                        onClick={(e) => {
                          const filterUid =
                            filterNodeUid ||
                            createBlock({
                              parentUid: blockUid,
                              node: {
                                text: "filter",
                                children: [
                                  { text: "includes" },
                                  { text: "excludes" },
                                ],
                              },
                            });
                          setFilterNodeUid(filterUid);
                          const { setter, key, vals } = !e.shiftKey
                            ? {
                                setter: setIncludes,
                                key: "includes",
                                vals: includes,
                              }
                            : {
                                setter: setExcludes,
                                key: "excludes",
                                vals: excludes,
                              };
                          const uid = addInputSetting({
                            blockUid: filterUid,
                            value: tag,
                            key,
                          });
                          const newVals = [...vals, { uid, text: tag }];
                          setter(newVals);
                          onChange({
                            includes: includes.map(({ text }) => text),
                            excludes: excludes.map(({ text }) => text),
                            [key]: newVals.map(({ text }) => text),
                          });
                        }}
                      >
                        {tag}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      }
    />
  );
};

export default TagFilter;
