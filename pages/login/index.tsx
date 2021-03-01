import { SignIn } from "@clerk/clerk-react";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  return (
    <Layout>
      <SignIn />
    </Layout>
  );
};

export default LoginPage;
