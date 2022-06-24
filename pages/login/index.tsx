import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Loading } from "@dvargas92495/ui";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import Layout from "../../components/Layout";

const Redirect = () => {
  const router = useRouter();
  const { extension, state = "roamjs" } = useRouter().query;
  useEffect(() => {
    if (extension) {
      router.push(`/extensions/${extension}?started=true&state=${state}`);
    } else {
      router.push("/");
    }
  }, [extension, state]);
  return (
    <div>
      <Loading loading />
      <span style={{ marginLeft: 32 }}>Redirecting...</span>
    </div>
  );
};

const LoginPage = (): JSX.Element => {
  const { extension, state = "roamjs" } = useRouter().query;
  const signInProps = extension
    ? {
        afterSignIn: `${window.location.origin}/extensions/${extension}?started=true&state=${state}`,
        signUpURL: `${window.location.origin}/signup?extension=${extension}&state=${state}`,
      }
    : {};
  return (
    <Layout
      title={"Login | RoamJS"}
      description={"Login to RoamJS to get access to subscribed services"}
    >
      <SignedIn>
        <Redirect />
      </SignedIn>
      <SignedOut>
        <SignIn {...signInProps} />
      </SignedOut>
    </Layout>
  );
};

export default LoginPage;
