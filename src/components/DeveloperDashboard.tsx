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
  createPage,
  getPageTitlesStartingWithPrefix,
  getPageUidByPageTitle,
  getPageViewType,
  getTreeByPageName,
  TreeNode,
} from "roam-client";
import { getSettingValuesFromTree } from "roamjs-components";
import {
  getRoamUrl,
  openBlockInSidebar,
  setInputSetting,
} from "../entry-helpers";
import { getSettingValueFromTree } from "./hooks";
import {
  TOKEN_STAGE,
  MainStage,
  ServiceDashboard,
  StageContent,
  useAuthenticatedAxiosDelete,
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPut,
  useNextStage,
  usePageUid,
  useField,
  NextButton,
  useSetMetadata,
  useGetMetadata,
} from "./ServiceCommonComponents";

export const developerToaster = Toaster.create({
  position: Position.TOP,
});

const DeveloperContent: StageContent = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const setMetadataPaths = useSetMetadata("paths");
  const [newPath, setNewPath] = useState("");
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  const authenticatedAxiosDelete = useAuthenticatedAxiosDelete();
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
      authenticatedAxiosGet("metadata?service=developer&key=paths")
        .then((r) => setAllPaths(r.data.value || []))
        .catch(() => setAllPaths([]))
        .finally(() => setInitialLoading(false));
    }
  }, [initialLoading, setInitialLoading]);
  const prefix = useField("prefix");
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
                  window.location.assign(getRoamUrl(uid));
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
                      const subpageTitles = window.roamAlphaAPI
                        .q(
                          `[:find ?title :where [?b :node/title ?title][(clojure.string/starts-with? ?title  "${title}/")]]`
                        )
                        .map((r) => r[0]);
                      authenticatedAxiosPut("publish", {
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
                              nodes: getTreeByPageName(t),
                              viewType: getPageViewType(t),
                            },
                          ])
                        ),
                        thumbnail: getSettingValueFromTree({
                          tree,
                          key: "thumbnail",
                        }).match(/!\[(?:.*?)\]\((.*?)\)/)?.[1],
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
                    authenticatedAxiosDelete(
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
            authenticatedAxiosPost("request-path", { path: newPath })
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
  const nextStage = useNextStage(openPanel);
  const pageUid = usePageUid();
  const paths = useGetMetadata("paths") as string[];
  const oldPrefix = useField("prefix");
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
      <NextButton onClick={onSubmit} disabled={disabled} />
    </>
  );
};

const DeveloperDashboard = (): React.ReactElement => (
  <ServiceDashboard
    service={"developer"}
    stages={[
      TOKEN_STAGE,
      MainStage(DeveloperContent),
      {
        component: RequestPrefixContent,
        setting: "Prefix",
      },
    ]}
  />
);

export default DeveloperDashboard;
