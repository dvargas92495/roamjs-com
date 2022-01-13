import React from "react";
import Layout, { LayoutProps } from "./Layout";

const StandardLayout: React.FunctionComponent<LayoutProps> = ({
  children,
  ...layoutProps
}) => (
  <Layout {...layoutProps}>
    <div className={'roamjs-standard-layout'}>{children}</div>
  </Layout>
);

export default StandardLayout;
