import { Button, Popover } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";

const WikiData = ({ defaultIsOpen }: { defaultIsOpen: boolean }) => {
  return (
    <Popover
      content={<div>WikiData Integration Coming Soon!</div>}
      target={<Button text="WIKI" />}
      defaultIsOpen={defaultIsOpen}
    />
  );
};

export const renderWikiData = (p: HTMLElement) =>
  ReactDOM.render(<WikiData defaultIsOpen={true} />, p);

export const DemoWikiData = () => <WikiData defaultIsOpen={false} />;

export default WikiData;
