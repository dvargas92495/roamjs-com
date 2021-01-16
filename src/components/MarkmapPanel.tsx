import { Button, Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS } from "markmap-view";

const transformer = new Transformer();
const CLASSNAME = "roamjs-markmap-class";

const MarkmapPanel: React.FunctionComponent<{ getMarkdown: () => string }> = ({
  getMarkdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
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
    loadJS(scripts);
    markmapRef.current = Markmap.create("#roamjs-markmap", null, root);
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
  const containerRef = useRef(null);
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
    loadMarkmap();
  }, [loadMarkmap, unload]);
  return (
    <>
      <MenuItem text={"Open Markmap"} onClick={open} />
      <Drawer
        onClose={close}
        title="Markmap Panel"
        isOpen={isOpen}
        position={Position.BOTTOM}
        hasBackdrop={false}
        canOutsideClickClose={false}
        canEscapeKeyClose
        enforceFocus={false}
      >
        <div ref={containerRef} style={{ height: "100%" }}>
          <svg id="roamjs-markmap" style={{ width: "100%", height: "100%" }} />
          <Button
            minimal
            icon={"refresh"}
            onClick={refresh}
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
