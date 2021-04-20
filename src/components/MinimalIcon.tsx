import {
  Button,
  IButtonProps,
  IconName,
  ITooltipProps,
  Tooltip,
} from "@blueprintjs/core";
import React, { useState } from "react";
import ReactDOM from "react-dom";

type Props = Pick<IButtonProps, "icon" | "onClick"> & {
  toggleIcon?: IconName;
  onToggleClick?: IButtonProps["onClick"];
} & { tooltipContent: ITooltipProps["content"] };

const MinimalIcon = ({
  toggleIcon,
  icon,
  onClick,
  onToggleClick,
  tooltipContent,
}: Props): React.ReactElement => {
  const [toggled, setToggled] = useState(false);
  return (
    <Tooltip content={tooltipContent}>
      <Button
        icon={toggled ? toggleIcon : icon}
        minimal
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (toggleIcon) {
            setToggled(!toggled);
          }
          if (toggled) {
            onToggleClick(e);
          } else {
            onClick(e);
          }
        }}
      />
    </Tooltip>
  );
};

export const render = ({ p, ...props }: { p: HTMLElement } & Props): void =>
  ReactDOM.render(<MinimalIcon {...props} />, p);

export default MinimalIcon;
