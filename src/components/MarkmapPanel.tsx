import { Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS } from "markmap-view";

const transformer = new Transformer();

const MarkmapPanel: React.FunctionComponent<{ getMarkdown: () => string }> = ({
  getMarkdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => {
    setIsOpen(false);
    setLoaded(false);
  }, [setLoaded, setIsOpen]);
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
        content.style.pointerEvents = "initial";
        const { root, features } = transformer.transform(getMarkdown());
        const { styles, scripts } = transformer.getUsedAssets(features);
        loadCSS(styles);
        loadJS(scripts);
        Markmap.create('#roamjs-markmap', null, root);
      }
    }
  }, [containerRef.current, loaded, getMarkdown]);
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
        <div ref={containerRef}>
          <svg id="roamjs-markmap" style={{ width: 800, height: 800 }} />
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
