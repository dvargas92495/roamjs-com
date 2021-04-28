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
import React, { useEffect, useState } from "react";
import {
  createPage,
  getPageUidByPageTitle,
  getTreeByPageName,
  TreeNode,
} from "roam-client";
import {
  getRoamUrl,
  openBlockInSidebar,
  setInputSetting,
} from "../entry-helpers";
import {
  TOKEN_STAGE,
  MainStage,
  ServiceDashboard,
  StageContent,
  useAuthenticatedAxiosDelete,
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPut,
} from "./ServiceCommonComponents";

export const developerToaster = Toaster.create({
  position: Position.TOP,
});

const DeveloperContent: StageContent = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState("");
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  const authenticatedAxiosDelete = useAuthenticatedAxiosDelete();
  const [error, setError] = useState("");
  useEffect(() => {
    if (initialLoading) {
      authenticatedAxiosGet("metadata?service=developer&key=paths")
        .then((r) => setPaths(r.data.value || []))
        .catch(() => setPaths([]))
        .finally(() => setInitialLoading(false));
    }
  }, [initialLoading, setInitialLoading]);
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
                const uid = getPageUidByPageTitle(p);
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
                    const { children, viewType } = getTreeByPageName(
                      p
                    ).find((t) => /documentation/i.test(t.text)) || {
                      children: [] as TreeNode[],
                      viewType: "document",
                    };
                    authenticatedAxiosPut("publish", {
                      path: p,
                      blocks: children,
                      viewType,
                    })
                      .then((r) => {
                        setInputSetting({
                          blockUid: getPageUidByPageTitle(p),
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
                  }}
                />
              </Tooltip>
              <Tooltip content={"Delete Path"}>
                <Button
                  icon={"delete"}
                  minimal
                  onClick={() => {
                    setLoading(true);
                    authenticatedAxiosDelete(`request-path?path=${p}`)
                      .then((r) => setPaths(r.data.paths))
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
                setPaths(r.data.paths);
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

const DeveloperDashboard = (): React.ReactElement => (
  <ServiceDashboard
    service={"developer"}
    stages={[TOKEN_STAGE, MainStage(DeveloperContent)]}
  />
);

export default DeveloperDashboard;
