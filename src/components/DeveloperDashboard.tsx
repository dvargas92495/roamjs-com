import {
  Button,
  InputGroup,
  Intent,
  Label,
  Position,
  Spinner,
  Toaster,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import {
  BLOCK_REF_REGEX,
  createPage,
  getPageTitleByBlockUid,
  getPageTitlesStartingWithPrefix,
  getPageUidByPageTitle,
  getPageViewType,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  TreeNode,
} from "roam-client";
import {
  getSettingValueFromTree,
  getSettingValuesFromTree,
  ServiceDashboard,
  StageContent,
  ServiceNextButton,
  setInputSetting,
  SERVICE_TOKEN_STAGE,
  useAuthenticatedDelete,
  useAuthenticatedPost,
  useAuthenticatedGet,
  useAuthenticatedPut,
  useServiceNextStage,
  useServicePageUid,
  useServiceField,
  useServiceSetMetadata,
  useServiceGetMetadata,
  WrapServiceMainStage,
} from "roamjs-components";
import { openBlockInSidebar } from "../entry-helpers";

export const developerToaster = Toaster.create({
  position: Position.TOP,
});

const EMBED_REF_REGEX = new RegExp(
  `{{(?:\\[\\[)?embed(?:\\]\\])?:\\s*${BLOCK_REF_REGEX.source}\\s*}}`,
  "g"
);

const ALIAS_BLOCK_REGEX = new RegExp(
  `\\[(.*?)\\]\\(${BLOCK_REF_REGEX.source}\\)`,
  "g"
);

const DeveloperContent: StageContent = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const setMetadataPaths = useServiceSetMetadata("paths");
  const [newPath, setNewPath] = useState("");
  const authenticatedGet = useAuthenticatedGet();
  const authenticatedPost = useAuthenticatedPost();
  const authenticatedPut = useAuthenticatedPut();
  const authenticatedDelete = useAuthenticatedDelete();
  const [error, setError] = useState("");
  const setAllPaths = useCallback(
    (ps) => {
      setPaths(ps);
      setMetadataPaths(ps);
    },
    [setPaths, setMetadataPaths]
  );
  useEffect(() => {
    if (initialLoading) {
      authenticatedGet("metadata?service=developer&key=paths")
        .then((r) => setAllPaths(r.data.value || []))
        .catch(() => setAllPaths([]))
        .finally(() => setInitialLoading(false));
    }
  }, [initialLoading, setInitialLoading]);
  const prefix = useServiceField("prefix");
  return initialLoading ? (
    <Spinner />
  ) : (
    <div>
      <h4>Paths</h4>
      <ul>
        {paths.map((p) => (
          <li
            key={p}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            className={"roamjs-developer-path"}
          >
            <span
              style={{
                cursor: "pointer",
              }}
              onClick={(e) => {
                const title = `${prefix}${p}`;
                const uid =
                  getPageUidByPageTitle(title) || createPage({ title });
                if (e.shiftKey) {
                  openBlockInSidebar(uid);
                } else {
                  window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } });
                }
              }}
            >
              {p}
            </span>
            <span style={{ marginRight: 16 }}>
              <Tooltip content={"Update Documentation"}>
                <Button
                  icon={"upload"}
                  minimal
                  style={{ margin: "0 8px" }}
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setTimeout(() => {
                      const title = `${prefix}${p}`;
                      const tree = getTreeByPageName(title);
                      const { children, viewType } = tree.find((t) =>
                        /documentation/i.test(t.text)
                      ) || {
                        children: [] as TreeNode[],
                        viewType: "document",
                      };
                      const isExternal = (s: string) =>
                        s !== p && !s.startsWith(`${p}/`);
                      const resolveRefsInNode = (t: TreeNode) => {
                        t.text = t.text
                          .replace(EMBED_REF_REGEX, (_, blockUid) => {
                            const tree = getTreeByBlockUid(blockUid);
                            t.children.push(...tree.children);
                            t.heading = tree.heading;
                            t.viewType = tree.viewType || "bullet";
                            t.textAlign = tree.textAlign;
                            return tree.text;
                          })
                          .replace(ALIAS_BLOCK_REGEX, (_, alias, blockUid) => {
                            const page = getPageTitleByBlockUid(blockUid)
                              .replace(/ /g, "_")
                              .toLowerCase();
                            return isExternal(page)
                              ? alias
                              : `[${alias}](/extensions/${page}#${blockUid})`;
                          })
                          .replace(BLOCK_REF_REGEX, (_, blockUid) => {
                            const reference = getTextByBlockUid(blockUid);
                            const page = getPageTitleByBlockUid(blockUid)
                              .replace(/ /g, "_")
                              .toLowerCase();
                            return isExternal(page)
                              ? reference
                              : `[${reference}](/extensions/${page}#${blockUid})`;
                          });
                        t.children.forEach(resolveRefsInNode);
                      };
                      children.forEach(resolveRefsInNode);
                      const subpageTitles = window.roamAlphaAPI
                        .q(
                          `[:find ?title :where [?b :node/title ?title][(clojure.string/starts-with? ?title  "${title}/")]]`
                        )
                        .map((r) => r[0]);
                      authenticatedPut("publish", {
                        path: p,
                        blocks: children,
                        viewType,
                        description: getSettingValueFromTree({
                          tree,
                          key: "description",
                        }),
                        contributors: getSettingValuesFromTree({
                          tree,
                          key: "contributors",
                        }),
                        subpages: Object.fromEntries(
                          subpageTitles.map((t) => [
                            t.substring(title.length + 1),
                            {
                              nodes: getTreeByPageName(t).map((t) => {
                                resolveRefsInNode(t);
                                return t;
                              }),
                              viewType: getPageViewType(t),
                            },
                          ])
                        ),
                        thumbnail: getSettingValueFromTree({
                          tree,
                          key: "thumbnail",
                        }).match(/!\[(?:.*?)\]\((.*?)\)/)?.[1],
                        entry: getSettingValueFromTree({
                          tree,
                          key: "entry",
                        }),
                      })
                        .then((r) => {
                          setInputSetting({
                            blockUid: getPageUidByPageTitle(title),
                            value: r.data.etag,
                            key: "ETag",
                            index: 1,
                          });
                          developerToaster.show({
                            message: "Documentation has updated successfully!",
                            intent: Intent.SUCCESS,
                          });
                        })
                        .catch((e) =>
                          setError(
                            e.response?.data?.error ||
                              e.response?.data ||
                              e.message
                          )
                        )
                        .finally(() => setLoading(false));
                    }, 1);
                  }}
                />
              </Tooltip>
              <Tooltip content={"Delete Path"}>
                <Button
                  icon={"delete"}
                  minimal
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    authenticatedDelete(
                      `request-path?path=${encodeURIComponent(p)}`
                    )
                      .then((r) => setAllPaths(r.data.paths))
                      .catch((e) =>
                        setError(
                          e.response?.data?.error ||
                            e.response?.data ||
                            e.message
                        )
                      )
                      .finally(() => setLoading(false));
                  }}
                />
              </Tooltip>
            </span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center" }}>
        <Label style={{ flexGrow: 1 }}>
          Path
          <InputGroup
            value={newPath}
            onChange={(e) => {
              setNewPath(e.target.value);
              setError("");
            }}
            intent={error ? Intent.DANGER : Intent.PRIMARY}
          />
          <span style={{ color: "darkred" }}>{error}</span>
        </Label>
        <Button
          onClick={() => {
            setLoading(true);
            authenticatedPost("request-path", { path: newPath })
              .then((r) => {
                createPage({
                  title: newPath,
                  tree: [{ text: "Documentation" }],
                });
                setNewPath("");
                setAllPaths(r.data.paths);
              })
              .catch((e) => setError(e.response?.data || e.message))
              .finally(() => setLoading(false));
          }}
          style={{ margin: "8px 16px 0 16px" }}
          disabled={!!error}
        >
          Request Path
        </Button>
      </div>
      <div>{loading && <Spinner size={16} />}</div>
    </div>
  );
};

const RequestPrefixContent: StageContent = ({ openPanel }) => {
  const nextStage = useServiceNextStage(openPanel);
  const pageUid = useServicePageUid();
  const paths = useServiceGetMetadata("paths") as string[];
  const oldPrefix = useServiceField("prefix");
  const [value, setValue] = useState(oldPrefix);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onSubmit = useCallback(() => {
    setInputSetting({ blockUid: pageUid, key: "prefix", value, index: 1 });
    paths
      .flatMap((s) => [
        s,
        ...getPageTitlesStartingWithPrefix(`${oldPrefix}${s}/`).map((sp) =>
          sp.substring(oldPrefix.length)
        ),
      ])
      .forEach((s) =>
        window.roamAlphaAPI.updatePage({
          page: {
            uid: getPageUidByPageTitle(`${oldPrefix}${s}`),
            title: `${value}${s}`,
          },
        })
      );
    nextStage();
  }, [value, nextStage, pageUid]);
  const disabled = value === oldPrefix;
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !disabled
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <Label>
        {"Documentation Prefix"}
        <InputGroup value={value} onChange={onChange} onKeyDown={onKeyDown} />
      </Label>
      <ServiceNextButton onClick={onSubmit} disabled={disabled} />
    </>
  );
};

const DeveloperDashboard = (): React.ReactElement => (
  <ServiceDashboard
    service={"developer"}
    stages={[
      SERVICE_TOKEN_STAGE,
      WrapServiceMainStage(DeveloperContent),
      {
        component: RequestPrefixContent,
        setting: "Prefix",
      },
    ]}
  />
);

export default DeveloperDashboard;
