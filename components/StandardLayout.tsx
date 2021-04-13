import React from "react";
import Layout, { LayoutProps } from "./Layout";

const StandardLayout: React.FunctionComponent<LayoutProps> = ({
  children,
  ...layoutProps
}) => (
  <Layout {...layoutProps}>
    <div style={{ maxWidth: 760, width: "95vw" }}>{children}</div>
  </Layout>
);

export default StandardLayout;
