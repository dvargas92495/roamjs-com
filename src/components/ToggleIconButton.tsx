import { Button, IconName } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";

const ToggleIconButton = ({
  icon,
  on,
  onClick,
  style,
}: {
  icon: IconName;
  on: boolean;
} & Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "style"
>): React.ReactElement => {
  const [isHover, setIsHover] = useState(false);
  const hover = useCallback(() => setIsHover(true), [setIsHover]);
  const leave = useCallback(() => setIsHover(false), [setIsHover]);
  const [isDown, setIsDown] = useState(false);
  const down = useCallback(() => {
    setIsDown(true);
    document.addEventListener("mouseup", () => setIsDown(false), {
      once: true,
    });
  }, [setIsDown]);
  return (
    <Button
      icon={icon}
      onClick={onClick}
      style={{
        backgroundColor: isDown
          ? on
            ? "transparent"
            : "rgba(115,134,148,0.3)"
          : isHover
          ? "rgba(167,182,194,0.3)"
          : on
          ? "rgba(115,134,148,0.3)"
          : "transparent",
        ...style,
      }}
      minimal
      onMouseOver={hover}
      onMouseEnter={hover}
      onMouseLeave={leave}
      onMouseDown={down}
    />
  );
};

export default ToggleIconButton;
