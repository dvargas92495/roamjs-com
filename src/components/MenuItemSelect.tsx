import { Button, IButtonProps, MenuItem } from "@blueprintjs/core";
import { ISelectProps, Select } from "@blueprintjs/select";
import React, { ReactText } from "react";

const MenuItemSelect = <T extends ReactText>(
  props: Omit<ISelectProps<T>, "itemRenderer"> & { ButtonProps?: IButtonProps }
) => {
  const TypeSelect = Select.ofType<T>();
  return (
    <TypeSelect
      {...props}
      itemRenderer={(item, { modifiers, handleClick }) => (
        <MenuItem
          key={item}
          text={item}
          active={modifiers.active}
          onClick={handleClick}
        />
      )}
      filterable={false}
      popoverProps={{ minimal: true, captureDismiss: true }}
    >
      <Button
        {...props.ButtonProps}
        text={props.activeItem}
        rightIcon="double-caret-vertical"
      />
    </TypeSelect>
  );
};

export default MenuItemSelect;
