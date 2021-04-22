import { differenceInMilliseconds } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  getUidsFromId,
  TreeNode,
} from "roam-client";

export const useArrowKeyDown = <T>({
  results,
  onEnter,
}: {
  results: T[];
  onEnter: (i: T) => void;
}): {
  activeIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length > 0) {
        if (e.key === "ArrowDown") {
          setActiveIndex((activeIndex + 1) % results.length);
          e.preventDefault();
          e.stopPropagation();
        } else if (e.key === "ArrowUp") {
          setActiveIndex((activeIndex + results.length - 1) % results.length);
          e.preventDefault();
          e.stopPropagation();
        } else if (e.key === "Enter") {
          onEnter(results[activeIndex]);
          setActiveIndex(0);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    [activeIndex, setActiveIndex, results, onEnter]
  );
  return {
    activeIndex,
    onKeyDown,
  };
};

export const useDocumentKeyDown = (
  eventListener: (e: KeyboardEvent) => void
): void =>
  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  }, [eventListener]);

export const getRenderRoot = (id: string): HTMLDivElement => {
  const app = document.getElementById("app");
  const newRoot = document.createElement("div");
  newRoot.id = `roamjs-${id}-root`;
  app.parentElement.appendChild(newRoot);
  return newRoot;
};

export const getSettingValueFromTree = ({
  tree,
  key,
  defaultValue = "",
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: string;
}): string => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node ? node.children[0].text.trim() : defaultValue;
  return value;
};

export const getSettingIntFromTree = ({
  tree,
  key,
  defaultValue = 0,
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: number;
}): number => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node?.children?.[0]?.text?.trim?.();
  return isNaN(Number(value)) ? defaultValue : parseInt(value);
};

export const getSettingValuesFromTree = ({
  tree,
  key,
  defaultValue = [],
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: string[];
}): string[] => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node ? node.children.map((t) => t.text.trim()) : defaultValue;
  return value;
};

export const allBlockMapper = (t: TreeNode): TreeNode[] => [
  t,
  ...t.children.flatMap(allBlockMapper),
];

export const useSocialToken = (): string =>
  useMemo(
    () =>
      getTreeByPageName("roam/js/social").find((t) => /token/i.test(t.text))
        ?.children?.[0]?.text,
    []
  );

export const getTreeByHtmlId = (
  blockId: string
): { children: TreeNode[]; text: string } =>
  getTreeByBlockUid(getUidsFromId(blockId).blockUid);

export const useTreeByHtmlId = (
  blockId: string
): { children: TreeNode[]; text: string } =>
  useMemo(() => getTreeByHtmlId(blockId), [blockId]);

export const useTree = (
  blockUid: string
): { children: TreeNode[]; text: string } =>
  useMemo(() => getTreeByBlockUid(blockUid), [blockUid]);

export const toTitle = (id: string): string =>
  id
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ");

const monitorCache: { [label: string]: number } = {};
export const monitor = <T>(label: string, callback: (props: T) => void) => (
  props: T
): void => {
  monitorCache[label] = (monitorCache[label] || 0) + 1;
  const start = new Date();
  console.log(label, "start", monitorCache[label]);
  callback(props);
  console.log(label, "end", differenceInMilliseconds(new Date(), start));
};

export const renderWithUnmount = (
  el: React.ReactElement,
  p: HTMLElement
): void => {
  ReactDOM.render(el, p);
  const unmountObserver = new MutationObserver((ms) => {
    const parentRemoved = ms
      .flatMap((m) => Array.from(m.removedNodes))
      .some((n) => n === p || n.contains(p));
    if (parentRemoved) {
      unmountObserver.disconnect();
      ReactDOM.unmountComponentAtNode(p);
    }
  });
  unmountObserver.observe(document.body, { childList: true, subtree: true });
};
