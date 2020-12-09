import { Button } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import { openBlock } from "roam-client";

const editCallback = (blockId?: string) => () =>
  openBlock(document.getElementById(blockId));

const EditContainer = ({
  blockId,
  className,
  children,
}: {
  blockId?: string;
  className?: string;
  children: React.ReactNode;
}) => {
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

export default EditContainer;
