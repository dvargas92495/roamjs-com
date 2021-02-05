import { Button, Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ITransformResult, Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, refreshHook } from "markmap-view";
import { format } from "date-fns";
import { isSafari } from "mobile-device-detect";
import download from "downloadjs";

const transformer = new Transformer();
const CLASSNAME = "roamjs-markmap-class";
export const NODE_CLASSNAME = "roamjs-mindmap-node";
const SVG_ID = "roamjs-markmap";
const RENDERED_TODO =
  '<span><label class="check-container"><input type="checkbox" disabled=""><span class="checkmark"></span></label></span>';
const RENDERED_DONE =
  '<span><label class="check-container"><input type="checkbox" checked="" disabled=""><span class="checkmark"></span></label></span>';

const transformRoot = ({ root }: Partial<ITransformResult>) => {
  if (root.c) {
    root.c = root.c.filter((child) => child.v !== "" || child.c?.length);
    root.c.forEach((child) => transformRoot({ root: child }));
  }
  root.v = root.v
    .replace(/{{(?:\[\[)?TODO(?:\]\])?}}/g, (s) =>
      isSafari ? s : RENDERED_TODO
    )
    .replace(/{{(?:\[\[)?DONE(?:\]\])?}}/g, (s) =>
      isSafari ? s : RENDERED_DONE
    );
};

const shiftClickListener = (e: MouseEvent) => {
  if (e.shiftKey) {
    const target = e.target as HTMLElement;
    if (target.tagName === "SPAN" && target.className === NODE_CLASSNAME) {
      const blockUid = target.getAttribute("data-block-uid");
      const baseUrl = window.location.href.replace(/\/page\/.*$/, "");
      window.location.assign(`${baseUrl}/page/${blockUid}`);
    }
  }
};

const componentModes = {
  menu: MenuItem,
  button: Button,
};

const MarkmapPanel: React.FunctionComponent<{
  getMarkdown: () => string;
  mode: "menu" | "button";
}> = ({ getMarkdown, mode }) => {
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
    transformRoot({ root });
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
  const containerRef = useRef<HTMLDivElement>(null);
  const refresh = useCallback(() => {
    unload();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", SVG_ID);
    svg.setAttribute("style", "width: 100%; height: 100%");
    containerRef.current.insertBefore(svg, containerRef.current.firstChild);
    loadMarkmap();
  }, [loadMarkmap, unload, containerRef]);
  const open = useCallback(() => {
    setIsOpen(true);
    document.addEventListener("click", shiftClickListener);
    window.addEventListener("popstate", refresh);
  }, [setIsOpen, refresh]);
  const close = useCallback(() => {
    setIsOpen(false);
    setLoaded(false);
    unload();
    const article = document.getElementsByClassName(
      "roam-article"
    )[0] as HTMLDivElement;
    article.style.paddingBottom = "120px";
    document.removeEventListener("click", shiftClickListener);
    window.removeEventListener("popstate", refresh);
  }, [setLoaded, setIsOpen, unload]);
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
  const exporter = useCallback(async () => {
    const svgElement = document.getElementById(SVG_ID);
    const filename = `${format(new Date(), "yyyyMMddhhmmss")}_mindmap.png`;

    const canvas = document.createElement("canvas");
    canvas.width = svgElement.parentElement.offsetWidth;
    canvas.height = svgElement.parentElement.offsetHeight;
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svgElement);
    const img = new Image(canvas.width, canvas.height);
    img.onload = () => {
      document.body.appendChild(canvas);
      document.body.appendChild(img);
      // hack to allow image to paint on safari
      setTimeout(() => {
        ctx.drawImage(img, 0, 0);
        const uri = canvas.toDataURL("image/png");
        download(uri, filename, "image/png");
        img.remove();
        canvas.remove();
      }, 1);
    };
    img.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(data)}`;
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
  const DrawerTarget = componentModes[mode];
  return (
    <>
      <DrawerTarget text={"Open Mindmap"} onClick={open} />
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
          id={"roamjs-mindmap-container"}
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
  mode,
}: {
  parent: HTMLElement;
  getMarkdown: () => string;
  mode: "menu" | "button";
}): void =>
  ReactDOM.render(
    <MarkmapPanel getMarkdown={getMarkdown} mode={mode} />,
    parent
  );

export default MarkmapPanel;
