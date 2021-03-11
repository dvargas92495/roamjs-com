import {
  Alert,
  Button,
  Card,
  Icon,
  InputGroup,
  Intent,
  Label,
  Spinner,
  Switch,
  Tooltip,
} from "@blueprintjs/core";
import axios, { AxiosResponse } from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  createBlock,
  TextNode,
} from "roam-client";
import { getPageUidByPageTitle, setInputSetting } from "../entry-helpers";
import MenuItemSelect from "./MenuItemSelect";

const useAuthenticatedAxiosGet = (): ((
  path: string
) => Promise<AxiosResponse>) =>
  useCallback(
    (path: string) =>
      axios.get(`${process.env.REST_API_URL}/${path}`, {
        headers: { Authorization: `staticSite:${getToken()}` },
      }),
    []
  );

const useAuthenticatedAxiosPost = (): ((
  path: string,
  data?: Record<string, unknown>
) => Promise<AxiosResponse>) =>
  useCallback(
    (path: string, data?: Record<string, unknown>) =>
      axios.post(`${process.env.REST_API_URL}/${path}`, data || {}, {
        headers: { Authorization: `staticSite:${getToken()}` },
      }),
    []
  );

const getToken = () =>
  getTreeByPageName("roam/js/static-site").find((t) => /token/i.test(t.text))
    ?.children?.[0]?.text;

type StageValue =
  | "RequestToken"
  | "RequestUser"
  | "RequestDomain"
  | "RequestIndex"
  | "RequestFilters"
  | "Live";

const getStage = (): StageValue => {
  const tree = getTreeByPageName("roam/js/static-site");
  if (!tree.find((t) => /token/i.test(t.text))?.children?.[0]?.text) {
    return "RequestToken";
  } else if (!tree.find((t) => /share/i.test(t.text))) {
    return "RequestUser";
  } else if (!tree.some((t) => /domain/i.test(t.text))) {
    return "RequestDomain";
  } else if (!tree.some((t) => /index/i.test(t.text))) {
    return "RequestIndex";
  } else if (!tree.some((t) => /filter/i.test(t.text))) {
    return "RequestFilters";
  } else {
    return "Live";
  }
};

type StageContent = (props: {
  pageUid: string;
  setStage: (v: StageValue) => void;
  graph: string;
}) => React.ReactElement;

const RequestTokenContent: StageContent = ({ pageUid, setStage }) => {
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onSubmit = useCallback(() => {
    setInputSetting({ blockUid: pageUid, key: "token", value });
    setTimeout(() => setStage(getStage()), 1);
  }, [value, setStage, pageUid]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <p>Paste in your token from RoamJS below</p>
      <Label>
        RoamJS Static Site Token
        <InputGroup value={value} onChange={onChange} onKeyDown={onKeyDown} />
      </Label>
      <Button onClick={onSubmit} intent={Intent.PRIMARY}>
        NEXT
      </Button>
    </>
  );
};

const HIGHLIGHT = "3px dashed yellowgreen";

const RequestUserContent: StageContent = ({ setStage, pageUid }) => {
  const [ready, setReady] = useState(false);
  const [deploySwitch, setDeploySwitch] = useState(true);
  const onSwitchChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) =>
      setDeploySwitch((e.target as HTMLInputElement).checked),
    [setDeploySwitch]
  );
  const shareListener = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "DIV" &&
      target.parentElement.className.includes("bp3-menu-item") &&
      target.innerText.toUpperCase() === "SHARE"
    ) {
      const shareItem = target.parentElement as HTMLAnchorElement;
      shareItem.style.border = "unset";
      setReady(true);
      setTimeout(() => {
        const grid = document.getElementsByClassName("sharing-grid")[0];
        const textarea = Array.from(
          grid.getElementsByTagName("textarea")
        ).find((t) =>
          t.parentElement.previousElementSibling.innerHTML.startsWith("Readers")
        );
        if (textarea) {
          textarea.parentElement.parentElement.style.border = HIGHLIGHT;
          const guide = document.createElement("span");
          guide.style.fontSize = "8px";
          guide.innerText = "(Press Enter after adding support@roamjs.com)";
          textarea.parentElement.appendChild(guide);
        }
      }, 500);
    }
  }, []);
  useEffect(() => {
    const topbar = document.getElementsByClassName("rm-topbar")[0];
    if (topbar) {
      const moreMenu = topbar.getElementsByClassName(
        "bp3-icon-more"
      )[0] as HTMLSpanElement;
      if (moreMenu) {
        moreMenu.click();
        setTimeout(() => {
          const menuItems = moreMenu.closest(
            ".bp3-popover-target.bp3-popover-open"
          )?.nextElementSibling;
          if (menuItems) {
            const shareItem = Array.from(
              menuItems.getElementsByClassName("bp3-menu-item")
            )
              .map((e) => e as HTMLAnchorElement)
              .find((e) => e.innerText === "Share");
            if (shareItem) {
              shareItem.style.border = HIGHLIGHT;
            }
          }
        }, 500);
      }
    }
    document.addEventListener("click", shareListener);
    return () => document.removeEventListener("click", shareListener);
  }, [setReady]);
  const onSubmit = useCallback(() => {
    setInputSetting({
      blockUid: pageUid,
      key: "Share",
      value: `${deploySwitch}`,
    });
    setTimeout(() => setStage(getStage()), 1);
  }, [setStage, pageUid, deploySwitch, ready]);
  return (
    <>
      <p>
        Click the highlighted more menu above to share your graph with{" "}
        <code>support@roamjs.com</code> as a <b>Reader</b>.
      </p>
      <Switch
        checked={deploySwitch}
        onChange={onSwitchChange}
        labelElement={"Daily Deploys"}
      />
      <p style={{ fontSize: "8px", margin: "16px 0" }}>
        Why do we need this?{" "}
        <Tooltip
          content={
            <span style={{ maxWidth: 400 }}>
              RoamJS needs to access your Roam data for automatic daily updates.
              Instead of trusting RoamJS with your password, we are asking for
              read only permission. We will only access data based on your soon
              to be configured filters for the purposes of deploying your site.
            </span>
          }
        >
          <Icon icon={"info-sign"} iconSize={8} intent={Intent.PRIMARY} />
        </Tooltip>
      </p>
      <Button
        onClick={onSubmit}
        disabled={!ready && deploySwitch}
        intent={Intent.PRIMARY}
      >
        NEXT
      </Button>
    </>
  );
};

const RequestDomainContent: StageContent = ({ pageUid, setStage }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onBlur = useCallback(() => {
    if (!/\.[a-z]{2,8}$/.test(value)) {
      return setError("Invalid domain. Try a .com!");
    }
    return setError("");
  }, [value]);
  const onSubmit = useCallback(() => {
    setInputSetting({ blockUid: pageUid, key: "domain", value, index: 1 });
    setTimeout(() => setStage(getStage()), 1);
  }, [value, setStage]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <Label>
        Custom Domain
        <InputGroup
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
        <span style={{ color: "darkred" }}>{error}</span>
      </Label>
      <Button
        onClick={onSubmit}
        disabled={!!error || !value}
        intent={Intent.PRIMARY}
      >
        NEXT
      </Button>
    </>
  );
};

const RequestIndexContent: StageContent = ({ pageUid, setStage }) => {
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onSubmit = useCallback(() => {
    setInputSetting({ blockUid: pageUid, key: "index", value, index: 1 });
    setTimeout(() => setStage(getStage()), 1);
  }, [value, setStage]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <Label>
        Website Index
        <InputGroup value={value} onChange={onChange} onKeyDown={onKeyDown} />
      </Label>
      <Button onClick={onSubmit} intent={Intent.PRIMARY}>
        NEXT
      </Button>
    </>
  );
};

const RequestFiltersContent: StageContent = ({ pageUid, setStage }) => {
  const [filters, setFilters] = useState<(TextNode & { key: number })[]>([]);
  const [key, setKey] = useState(0);
  const onSubmit = useCallback(() => {
    const tree = getTreeByBlockUid(pageUid);
    const keyNode = tree.children.find((t) => /filter/i.test(t.text));
    if (keyNode) {
      keyNode.children.forEach(({ uid }) =>
        window.roamAlphaAPI.deleteBlock({ block: { uid } })
      );
      filters.forEach((node, order) =>
        createBlock({ node, order, parentUid: pageUid })
      );
    } else if (!keyNode) {
      createBlock({
        node: { text: "Filter", children: filters },
        order: 2,
        parentUid: pageUid,
      });
    }
    setTimeout(() => setStage(getStage()), 1);
  }, [filters]);
  const onAddFilter = useCallback(() => {
    setFilters([
      ...filters,
      {
        text: "TAGGED WITH",
        children: [{ text: "Website", children: [] }],
        key,
      },
    ]);
    setKey(key + 1);
  }, [filters, setFilters, key, setKey]);
  return (
    <>
      <div style={{ margin: "16px 0" }}>
        {filters.map((f) => (
          <div
            key={f.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingRight: "25%",
              marginBottom: 16,
            }}
          >
            <MenuItemSelect
              items={["STARTS WITH", "TAGGED WITH"]}
              onItemSelect={(s) =>
                setFilters(
                  filters.map((filter) =>
                    f.key === filter.key ? { ...filter, text: s } : filter
                  )
                )
              }
              activeItem={f.text}
            />
            <InputGroup
              value={f.children[0].text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters(
                  filters.map((filter) =>
                    f.key === filter.key
                      ? {
                          ...filter,
                          children: [{ text: e.target.value, children: [] }],
                        }
                      : filter
                  )
                )
              }
            />
            <Button
              icon={"trash"}
              minimal
              onClick={() =>
                setFilters(filters.filter((filter) => filter.key !== f.key))
              }
            />
          </div>
        ))}
        <Button onClick={onAddFilter}>ADD FILTER</Button>
      </div>
      <div>
        <Button onClick={onSubmit} intent={Intent.PRIMARY}>
          NEXT
        </Button>
      </div>
    </>
  );
};

const getLaunchBody = (graph: string) => {
  const tree = getTreeByPageName("roam/js/static-site");
  return {
    graph,
    domain: tree.find((t) => /domain/i.test(t.text))?.children?.[0]?.text,
    autoDeploysEnabled: true /*/true/i.test(
      tree.find((t) => /share/i.test(t.text))?.children?.[0]?.text
    ),*/,
  };
};

const isWebsiteReady = (w: { status: string; deploys: { status: string }[] }) =>
  w.status === "LIVE" &&
  w.deploys.length &&
  ["SUCCESS", "FAILURE"].includes(w.deploys[0].status);

const getStatusColor = (status: string) =>
  ["LIVE", "SUCCESS"].includes(status)
    ? "darkgreen"
    : status === "FAILURE"
    ? "darkred"
    : "goldenrod";

const LiveContent: StageContent = ({ graph }) => {
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [statusProps, setStatusProps] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [deploys, setDeploys] = useState<
    { status: string; date: string; uuid: string }[]
  >([]);
  const timeoutRef = useRef(0);

  const openShutdown = useCallback(() => setIsShutdownOpen(true), [
    setIsShutdownOpen,
  ]);
  const closeShutdown = useCallback(() => setIsShutdownOpen(false), [
    setIsShutdownOpen,
  ]);
  const getWebsite = useCallback(
    () =>
      authenticatedAxiosGet("website-status").then((r) => {
        if (r.data) {
          setStatusProps(r.data.statusProps);
          setStatus(r.data.status);
          setDeploys(r.data.deploys);
          if (!isWebsiteReady(r.data)) {
            timeoutRef.current = window.setTimeout(getWebsite, 5000);
          }
        } else {
          setStatusProps("{}");
          setStatus("");
          setDeploys([]);
        }
      }),
    [setStatus, setDeploys, timeoutRef, setStatusProps]
  );
  const wrapPost = useCallback(
    (path: string, data?: Record<string, unknown>) => () => {
      setError("");
      setLoading(true);
      authenticatedAxiosPost(path, data)
        .then(getWebsite)
        .catch((e) => setError(e.response?.data || e.message))
        .finally(() => setLoading(false));
    },
    [setError, setLoading, getWebsite, authenticatedAxiosPost]
  );
  const launchWebsite = useCallback(
    wrapPost("launch-website", getLaunchBody(graph)),
    [graph, wrapPost]
  );
  const manualDeploy = useCallback(wrapPost("deploy"), [wrapPost]);
  const shutdownWebsite = useCallback(wrapPost("shutdown-website", { graph }), [
    wrapPost,
    graph,
  ]);

  useEffect(() => () => clearTimeout(timeoutRef.current), [timeoutRef]);
  const siteDeploying = loading || !isWebsiteReady({ status, deploys });
  useEffect(() => {
    setLoading(true);
    getWebsite()
      .then(() => setInitialLoad(false))
      .catch((e) => setError(e.response?.data || e.message))
      .finally(() => setLoading(false));
  }, [setError, setLoading, setInitialLoad, getWebsite]);
  return (
    <>
      {loading && <Spinner />}
      {error && <div style={{ color: "darkred" }}>{error}</div>}
      {!initialLoad && (
        <>
          {status ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <span>Status</span>
                {status === "AWAITING VALIDATION" ? (
                  <div style={{ color: "darkblue" }}>
                    <span>{status}</span>
                    <br />
                    To continue, add the following Name Servers to your Domain
                    Management Settings:
                    <ul>
                      {(JSON.parse(statusProps).nameServers as string[]).map(
                        (n) => (
                          <li>{n}</li>
                        )
                      )}
                    </ul>
                  </div>
                ) : (
                  <span
                    style={{ marginLeft: 16, color: getStatusColor(status) }}
                  >
                    {status}
                  </span>
                )}
              </div>
              <Button
                style={{ marginRight: 32 }}
                disabled={siteDeploying}
                onClick={manualDeploy}
                intent={Intent.PRIMARY}
              >
                Manual Deploy
              </Button>
              <Button
                onClick={openShutdown}
                disabled={siteDeploying}
                intent={Intent.DANGER}
              >
                Shutdown
              </Button>
              <Alert
                isOpen={isShutdownOpen}
                onConfirm={shutdownWebsite}
                onClose={closeShutdown}
                canOutsideClickCancel
                canEscapeKeyCancel
                cancelButtonText={"Cancel"}
              >
                <p>
                  Are you sure you want to shut down this RoamJS website? This
                  operation is irreversible.
                </p>
              </Alert>
              <hr style={{ margin: "16px 0" }} />
              <h6>Deploys</h6>
              <ul>
                {deploys.map((d) => (
                  <div key={d.uuid}>
                    <span style={{ display: "inline-block", minWidth: "30%" }}>
                      At {new Date(d.date).toLocaleString()}
                    </span>
                    <span
                      style={{
                        marginLeft: 16,
                        color: getStatusColor(d.status),
                      }}
                    >
                      {d.status}
                    </span>
                  </div>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p>
                You're ready to launch your new site! Click the button below to
                start.
              </p>
              <Button
                disabled={loading}
                onClick={launchWebsite}
                intent={Intent.PRIMARY}
              >
                LAUNCH
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
};

const components = {
  RequestToken: RequestTokenContent,
  RequestUser: RequestUserContent,
  RequestDomain: RequestDomainContent,
  RequestIndex: RequestIndexContent,
  RequestFilters: RequestFiltersContent,
  Live: LiveContent,
};

const StaticSiteDashboard = (): React.ReactElement => {
  const pageUid = useMemo(
    () => getPageUidByPageTitle("roam/js/static-site"),
    []
  );
  const graph = useMemo(
    () =>
      new RegExp(`^#/app/(.*?)/page/${pageUid}$`).exec(window.location.hash)[1],
    [pageUid]
  );
  const [stage, setStage] = useState<StageValue>(getStage);
  const CardContent = components[stage];
  return (
    <Card>
      <h4>Static Site Dashboard</h4>
      <CardContent setStage={setStage} pageUid={pageUid} graph={graph} />
    </Card>
  );
};

export const render = (p: HTMLDivElement): void =>
  ReactDOM.render(<StaticSiteDashboard />, p);

export default StaticSiteDashboard;
