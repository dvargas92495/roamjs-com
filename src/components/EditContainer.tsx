import { Button } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";

const editCallback = (blockId?: string) => () =>
  document
    .getElementById(blockId)
    .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

const EditContainer: React.FunctionComponent<{
  blockId?: string;
  className?: string;
  containerStyleProps?: React.CSSProperties;
  refresh?: () => void;
}> = ({ blockId, className, children, containerStyleProps = {}, refresh }) => {
  const [showEditIcon, setShowEditIcon] = useState(false);
  const appear = useCallback(() => setShowEditIcon(true), [setShowEditIcon]);
  const disappear = useCallback(() => setShowEditIcon(false), [
    setShowEditIcon,
  ]);
  return (
    <div
      className={className}
      onMouseOver={appear}
      onMouseLeave={disappear}
      style={{ position: "relative", ...containerStyleProps }}
    >
      {showEditIcon && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}>
          {refresh && <Button icon={"refresh"} onClick={refresh} minimal />}
          {blockId && (
            <Button icon="edit" minimal onClick={editCallback(blockId)} />
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export const render = (d: HTMLElement): void => {
  const div = document.createElement("div");
  d.appendChild(div);
  d.style.position = "relative";
  div.style.position = "absolute";
  div.style.top = "0";
  div.style.right = "0";
  div.style.zIndex = "1000";
  ReactDOM.render(
    <Button
      icon="edit"
      minimal
      onClick={editCallback(d.closest(".roam-block").id)}
    />,
    div
  );
};

export default EditContainer;
