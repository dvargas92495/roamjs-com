import { SignUp } from "@clerk/clerk-react";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  return (
    <Layout>
      <SignUp />
    </Layout>
  );
};

export default LoginPage;
