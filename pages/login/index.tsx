import { SignIn } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React from "react";
import Layout, { defaultLayoutProps } from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  const { service, extension } = useRouter().query;
  const signInProps = extension
    ? {
        afterSignIn: `${window.location.origin}/extensions/${extension}?started=true`,
        signUpURL: `${window.location.origin}/signup?extension=${extension}`,
      }
    : service
    ? {
        afterSignIn: `${window.location.origin}/services/${service}?started=true`,
        signUpURL: `${window.location.origin}/signup?service=${service}`,
      }
    : {};
  return (
    <Layout
      title={"Login | RoamJS"}
      description={"Login to RoamJS to get access to subscribed services"}
      img={defaultLayoutProps.img}
    >
      <SignIn {...signInProps} />
    </Layout>
  );
};

export default LoginPage;
