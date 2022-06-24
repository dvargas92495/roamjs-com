import React from "react";
import Layout, { LayoutProps } from "./Layout";

const StandardLayout: React.FunctionComponent<LayoutProps> = ({
  children,
  ...layoutProps
}) => (
  <Layout {...layoutProps}>
    <div className={"max-w-3xl w-11/12"}>{children}</div>
  </Layout>
);

export default StandardLayout;
