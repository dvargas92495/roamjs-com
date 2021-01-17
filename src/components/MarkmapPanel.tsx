import { Button, Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, refreshHook } from "markmap-view";
import { format } from "date-fns";
import Canvg from "canvg";
import download from "downloadjs";

const transformer = new Transformer();
const CLASSNAME = "roamjs-markmap-class";
const SVG_ID = "roamjs-markmap";

const MarkmapPanel: React.FunctionComponent<{ getMarkdown: () => string }> = ({
  getMarkdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const expand = useCallback(() => setIsFullScreen(true), [setIsFullScreen]);
  const collapse = useCallback(() => setIsFullScreen(false), [setIsFullScreen]);
  const markmapRef = useRef<Markmap>(null);
  const unload = useCallback(() => {
    Array.from(document.getElementsByClassName(CLASSNAME)).forEach((e) =>
      e.parentElement.removeChild(e)
    );
    markmapRef.current.destroy();
  }, [markmapRef]);
  const loadMarkmap = useCallback(() => {
    const { root, features } = transformer.transform(getMarkdown());
    const { styles, scripts } = transformer.getUsedAssets(features);
    styles.forEach(({ type, data }) => {
      if (type === "stylesheet") {
        data["class"] = CLASSNAME;
      }
    });
    scripts.forEach(({ type, data }) => {
      if (type === "script") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data["class"] = CLASSNAME;
      }
    });
    loadCSS(styles);
    loadJS(scripts, { getMarkmap: () => ({ refreshHook }) });
    markmapRef.current = Markmap.create(`#${SVG_ID}`, null, root);
  }, [markmapRef, getMarkdown]);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => {
    setIsOpen(false);
    setLoaded(false);
    unload();
    const article = document.getElementsByClassName(
      "roam-article"
    )[0] as HTMLDivElement;
    article.style.paddingBottom = "120px";
  }, [setLoaded, setIsOpen, unload]);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      setLoaded(true);
    }
  }, [setLoaded, isOpen]);
  useEffect(() => {
    if (containerRef.current && loaded) {
      const overlay = containerRef.current.closest(
        ".bp3-overlay-container"
      ) as HTMLDivElement;
      const content = containerRef.current.closest(
        ".bp3-overlay-content"
      ) as HTMLDivElement;
      if (overlay && content) {
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "2000";
        content.style.pointerEvents = "initial";
        const height = content.offsetHeight;
        const article = document.getElementsByClassName(
          "roam-article"
        )[0] as HTMLDivElement;
        article.style.paddingBottom = `${height + 120}px`;
        loadMarkmap();
      }
    }
  }, [containerRef.current, loaded, loadMarkmap]);
  const refresh = useCallback(() => {
    unload();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", SVG_ID);
    svg.setAttribute("style", "width: 100%; height: 100%");
    containerRef.current.insertBefore(svg, containerRef.current.firstChild);
    loadMarkmap();
  }, [loadMarkmap, unload, containerRef]);
  const exporter = useCallback(async () => {
    const svgElement = document.getElementById(SVG_ID);
    const filename = `${format(new Date(), "yyyyMMddhhmmss")}_mindmap.png`;

    const canvas = new OffscreenCanvas(
      svgElement.parentElement.offsetWidth,
      svgElement.parentElement.offsetHeight
    );
    const ctx = canvas.getContext("2d");
    const serializer = new XMLSerializer();
    const v = Canvg.fromString(ctx, serializer.serializeToString(svgElement));
    await v.render({ ignoreAnimation: false });
    const blob = await canvas.convertToBlob();
    const fileReader = new FileReader();
    fileReader.onload = (e) =>
      download(e.target.result as string, filename, "image/png");
    fileReader.readAsDataURL(blob);
  }, []);
  useEffect(() => {
    if (containerRef.current) {
      const content = containerRef.current.closest(
        ".bp3-overlay-content"
      ) as HTMLDivElement;
      if (content) {
        if (isFullScreen) {
          content.style.top = "0";
          content.style.height = "100%";
        } else {
          content.style.top = null;
          content.style.height = null;
        }
        refresh();
      }
    }
  }, [isFullScreen, containerRef, refresh]);
  return (
    <>
      <MenuItem text={"Open Mindmap"} onClick={open} />
      <Drawer
        onClose={close}
        title="Mindmap Panel"
        isOpen={isOpen}
        position={Position.BOTTOM}
        hasBackdrop={false}
        canOutsideClickClose={false}
        canEscapeKeyClose
        enforceFocus={false}
      >
        <div
          ref={containerRef}
          style={{ height: "100%", position: "relative" }}
        >
          <svg id={SVG_ID} style={{ width: "100%", height: "100%" }} />
          <Button
            minimal
            icon={"export"}
            onClick={exporter}
            style={{ position: "absolute", top: 8, right: 100 }}
          />
          <Button
            minimal
            icon={"refresh"}
            onClick={refresh}
            style={{ position: "absolute", top: 8, right: 54 }}
          />
          <Button
            minimal
            icon={isFullScreen ? "collapse-all" : "fullscreen"}
            onClick={isFullScreen ? collapse : expand}
            style={{ position: "absolute", top: 8, right: 8 }}
          />
        </div>
      </Drawer>
    </>
  );
};

export const render = ({
  parent,
  getMarkdown,
}: {
  parent: HTMLDivElement;
  getMarkdown: () => string;
}): void => ReactDOM.render(<MarkmapPanel getMarkdown={getMarkdown} />, parent);

export default MarkmapPanel;
