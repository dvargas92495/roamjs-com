import React from "react";
import Layout from "./Layout";

const StandardLayout: React.FunctionComponent = ({ children }) => (
  <Layout>
    <div style={{ maxWidth: 760, width: "95vw" }}>{children}</div>
  </Layout>
);

export default StandardLayout;
