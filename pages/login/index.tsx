import { SignIn } from "@clerk/clerk-react";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => (
  <Layout>
    <SignIn />
  </Layout>
);

export default LoginPage;
