import { SignIn } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  const { service } = useRouter().query;
  return (
    <Layout>
      {service ? (
        <SignIn afterSignIn={`${window.location.origin}/services/${service}`} />
      ) : (
        <SignIn />
      )}
    </Layout>
  );
};

export default LoginPage;
