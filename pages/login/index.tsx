import { SignIn } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React from "react";
import Layout, { defaultLayoutProps } from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  const { service } = useRouter().query;
  return (
    <Layout
      title={"Login | RoamJS"}
      description={"Login to RoamJS to get access to subscribed services"}
      img={defaultLayoutProps.img}
    >
      {service ? (
        <SignIn
          afterSignIn={`${window.location.origin}/services/${service}?started=true`}
          signUpURL={`${window.location.origin}/signup?service=${service}`}
        />
      ) : (
        <SignIn />
      )}
    </Layout>
  );
};

export default LoginPage;
