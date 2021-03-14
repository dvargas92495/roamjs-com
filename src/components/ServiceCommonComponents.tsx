import {
  Button,
  Card,
  InputGroup,
  Intent,
  Label,
  Panel,
  PanelProps,
  PanelStack2,
  ProgressBar,
} from "@blueprintjs/core";
import axios, { AxiosResponse } from "axios";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  createPage,
  getTreeByPageName,
  PullBlock,
  TreeNode,
  watchOnce,
} from "roam-client";
import {
  createPageTitleObserver,
  getPageUidByPageTitle,
  getRoamUrl,
  setInputSetting,
} from "../entry-helpers";

export const HIGHLIGHT = "3px dashed yellowgreen";
const toTitle = (service: string) =>
  service
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ");

const toCamel = (service: string) =>
  service
    .split("-")
    .map((s, i) =>
      i === 0 ? s : `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
    )
    .join("");

export const getTokenFromTree = (tree: TreeNode[]): string | undefined =>
  tree.find((t) => /token/i.test(t.text))?.children?.[0]?.text;

const isTokenInTree = (tree: TreeNode[]): boolean => !!getTokenFromTree(tree);

export const isFieldInTree = (field: string) => (tree: TreeNode[]): boolean =>
  tree.some((t) => new RegExp(field, "i").test(t.text));

export const useAuthenticatedAxiosGet = (): ((
  path: string
) => Promise<AxiosResponse>) => {
  const service = useService();
  return useCallback(
    (path: string) =>
      axios.get(`${process.env.REST_API_URL}/${path}`, {
        headers: { Authorization: `${toCamel(service)}:${getToken(service)}` },
      }),
    []
  );
};

export const useAuthenticatedAxiosPost = (): ((
  path: string,
  data?: Record<string, unknown>
) => Promise<AxiosResponse>) => {
  const service = useService();
  return useCallback(
    (path: string, data?: Record<string, unknown>) =>
      axios.post(`${process.env.REST_API_URL}/${path}`, data || {}, {
        headers: { Authorization: `${toCamel(service)}:${getToken(service)}` },
      }),
    []
  );
};

const getToken = (service: string) =>
  getTokenFromTree(getTreeByPageName(`roam/js/${service}`));

export const runService = ({
  id,
  Dashboard,
}: {
  id: string;
  Dashboard: React.FC;
}): void => {
  const title = `roam/js/${id}` as `roam/js/${string}`;

  createPageTitleObserver({
    title,
    callback: (d: HTMLDivElement) => {
      const parent = document.createElement("div");
      parent.id = "roamjs-static-site-dashboard";
      d.firstElementChild.insertBefore(
        parent,
        d.firstElementChild.firstElementChild.nextElementSibling
      );
      ReactDOM.render(<Dashboard />, parent);
    },
  });

  if (!getPageUidByPageTitle(title)) {
    watchOnce(
      "[*]",
      `[:node/title "${title}"]`,
      (before: PullBlock, after: PullBlock) => {
        if (before === null) {
          window.location.assign(getRoamUrl(after[":block/uid"]));
          return true;
        }
        return false;
      }
    );

    createPage({
      title,
      tree: [
        {
          text: "token",
          children: [],
        },
      ],
    });
  }
};

// eslint-disable-next-line @typescript-eslint/ban-types
type StageProps = PanelProps<object>;
export type StageContent = (props: StageProps) => React.ReactElement;
type GetStage = () => StageContent;

const ServiceContext = React.createContext<{
  pageUid: string;
  getStage: GetStage;
  service: string;
}>({
  pageUid: "UNSET-UID",
  getStage: () => () => <div />,
  service: "service",
});

const useService = (): string => useContext(ServiceContext).service;
export const usePageUid = (): string => useContext(ServiceContext).pageUid;

export const useNextStage = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  openPanel: (panel: Panel<object>) => void
): (() => void) => {
  const getStage = useContext(ServiceContext).getStage;
  return useCallback(
    () =>
      setTimeout(
        () =>
          openPanel({
            renderPanel: getStage(),
          }),
        1
      ),
    [getStage, openPanel]
  );
};

export const NextButton = ({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}): React.ReactElement => (
  <Button
    onClick={onClick}
    intent={Intent.PRIMARY}
    disabled={disabled}
    style={{ maxWidth: 240 }}
  >
    NEXT
  </Button>
);

const RequestTokenContent: StageContent = ({ openPanel }) => {
  const nextStage = useNextStage(openPanel);
  const pageUid = usePageUid();
  const service = useService();
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onSubmit = useCallback(() => {
    setInputSetting({ blockUid: pageUid, key: "token", value });
    nextStage();
  }, [value, nextStage, pageUid]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        value
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <Label>
        RoamJS {toTitle(service)} Token
        <InputGroup value={value} onChange={onChange} onKeyDown={onKeyDown} />
      </Label>
      <NextButton onClick={onSubmit} disabled={!value} />
    </>
  );
};

export const TOKEN_STAGE = {
  check: isTokenInTree,
  component: RequestTokenContent,
};

export const ServiceDashboard: React.FC<{
  service: string;
  stages: { component: StageContent; check: (tree: TreeNode[]) => boolean }[];
}> = ({ service, stages }) => {
  const title = `roam/js/${service}`;
  const pageUid = useMemo(() => getPageUidByPageTitle(title), [title]);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const getStage = useCallback(() => {
    const tree = getTreeByPageName(title);
    const index = stages.findIndex((s) => !s.check(tree));
    setProgress(index / (stages.length - 1));
    if (index < stages.length - 1) {
      setShowProgress(true);
    }
    return stages.slice(index)[0].component;
  }, [title, stages, setProgress, setShowProgress]);
  const renderPanel = useMemo(getStage, [getStage]);
  useEffect(() => {
    if (progress === 1) {
      setTimeout(() => setShowProgress(false), 3000);
    }
  }, [progress, setShowProgress]);
  return (
    <Card>
      <h4 style={{ padding: 4 }}>{toTitle(service)} Dashboard</h4>
      <ServiceContext.Provider value={{ getStage, pageUid, service }}>
        <style>
          {`.roamjs-service-panel {
  position: relative;
}

.bp3-panel-stack-view {
  border: 0px;
  padding: 4px;
  overflow-y: visible;
  position: static;
}

.bp3-panel-stack-header {
  box-shadow: none;
  position: absolute;
  top: -64px;
}

button.bp3-button.bp3-panel-stack-header-back {
  margin-left: 0;
}`}
        </style>
        <PanelStack2
          initialPanel={{
            renderPanel,
          }}
          className={"roamjs-service-panel"}
        />
        {showProgress && (
          <ProgressBar
            value={progress}
            animate={false}
            intent={Intent.PRIMARY}
          />
        )}
      </ServiceContext.Provider>
    </Card>
  );
};
