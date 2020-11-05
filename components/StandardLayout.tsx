import React from "react";
import Layout from "./Layout";

const StandardLayout = ({ children }) => {
  return (
    <Layout>
      <div style={{ maxWidth: 760 }}>{children}</div>
    </Layout>
  );
};

export default StandardLayout;
