import { Button } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { openBlock } from "roam-client";

const editCallback = (blockId?: string) => () =>
  openBlock(document.getElementById(blockId));

const EditContainer: React.FunctionComponent<{
  blockId?: string;
  className?: string;
}> = ({ blockId, className, children }) => {
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
      style={{ position: "relative" }}
    >
      {blockId && showEditIcon && (
        <Button
          icon="edit"
          minimal
          style={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}
          onClick={editCallback(blockId)}
        />
      )}
      {children}
    </div>
  );
};

export const render = (d: HTMLElement): void => {
  const div = document.createElement("div");
  d.appendChild(div);
  div.style.position = 'absolute';
  div.style.top = '8px';
  div.style.right = '8px';
  div.style.zIndex = '1000';
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
