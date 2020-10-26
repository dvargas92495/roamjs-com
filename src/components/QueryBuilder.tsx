import React from "react";
import { Button, Popover } from "@blueprintjs/core";

const QueryBuilder = () => {
  return (
    <Popover
      content={<div>Query Builder Coming Soon!</div>}
      target={<Button text="QUERY" />}
    />
  );
};

export default <QueryBuilder />;
