import { Button, InputGroup, Intent, Label, Spinner } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";
import {
  TOKEN_STAGE,
  MainStage,
  ServiceDashboard,
  StageContent,
  useAuthenticatedAxiosDelete,
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosGet,
} from "./ServiceCommonComponents";

const DeveloperContent: StageContent = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState("");
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const authenticatedAxiosDelete = useAuthenticatedAxiosDelete();
  const [error, setError] = useState("");
  useEffect(() => {
    if (initialLoading) {
      authenticatedAxiosGet("metadata?service=developer&key=paths")
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
          <li key={p} style={{ display: "flex" }}>
            <span>{p}</span>
            <Button
              icon={"delete"}
              minimal
              onClick={() => {
                setLoading(true);
                authenticatedAxiosDelete(`request-path?path=${p}`)
                  .then((r) => setPaths(r.data.paths))
                  .catch((e) => setError(e.response?.data || e.message))
                  .finally(() => setLoading(false));
              }}
            />
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <Label>
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
                setNewPath("");
                setPaths(r.data.paths);
              })
              .catch((e) => setError(e.response?.data || e.message))
              .finally(() => setLoading(false));
          }}
          style={{ margin: "0 16px" }}
          disabled={!!error}
        >
          Request Path
        </Button>
        {loading && <Spinner size={16} />}
      </div>
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
