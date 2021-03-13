import { Card } from "@blueprintjs/core";
import React, { useCallback, useMemo, useState } from "react";
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
} from "../entry-helpers";

export const HIGHLIGHT = "3px dashed yellowgreen";

export const getTokenFromTree = (tree: TreeNode[]): string | undefined =>
  tree.find((t) => /token/i.test(t.text))?.children?.[0]?.text;

export const isTokenInTree = (tree: TreeNode[]): boolean =>
  !!getTokenFromTree(tree);

export const isFieldInTree = (field: string) => (tree: TreeNode[]): boolean =>
  tree.some((t) => new RegExp(field, "i").test(t.text));

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

export type StageContent = (props: {
  pageUid: string;
  nextStage: () => void;
}) => React.ReactElement;

export const ServiceDashboard: React.FC<{
  service: string;
  stages: { component: StageContent; check: (tree: TreeNode[]) => boolean }[];
}> = ({ service, stages }) => {
  const title = `roam/js/${service}`;
  const pageUid = useMemo(() => getPageUidByPageTitle(title), [title]);
  const getStage = useCallback(() => {
    const tree = getTreeByPageName(title);
    return stages.findIndex((s) => !s.check(tree));
  }, [title, stages]);
  const [stage, setStage] = useState<number>(getStage);
  const CardContent = stages.slice(stage)[0].component;
  const nextStage = useCallback(
    () => setTimeout(() => setStage(getStage()), 1),
    [setStage, getStage]
  );
  return (
    <Card>
      <h4>
        {service
          .split("-")
          .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
          .join(" ")}{" "}
        Dashboard
      </h4>
      <CardContent nextStage={nextStage} pageUid={pageUid} />
    </Card>
  );
};
