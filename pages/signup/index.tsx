import { SignUp } from "@clerk/clerk-react";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  return (
    <Layout>
      <div style={{ marginBottom: 64 }}>
        <SignUp />
      </div>
    </Layout>
  );
};

export default LoginPage;
