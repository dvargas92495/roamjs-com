import { SignUp } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  const { service } = useRouter().query;
  return (
    <Layout>
      {service ? (
        <SignUp
          afterSignUp={`${window.location.origin}/services/${service}?started=true`}
          signInURL={`${window.location.origin}/login?service=${service}`}
        />
      ) : (
        <SignUp />
      )}
    </Layout>
  );
};

export default LoginPage;
