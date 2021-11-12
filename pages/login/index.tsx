import { SignedIn, SignIn } from "@clerk/clerk-react";
import Loading from "@dvargas92495/ui/dist/components/Loading";
import { useRouter } from "next/router";
import React, {useEffect} from "react";
import Layout, { defaultLayoutProps } from "../../components/Layout";

const Redirect = () => {
  const router = useRouter();
  const { service, extension, state = 'roamjs' } = useRouter().query;
  useEffect(() => {
    if (service) {
      router.push(`/service/${service}?started=true&state=${state}`);
    } else if (extension) {
      router.push(`/extension/${extension}?started=true&state=${state}`);
    } else {
      router.push('/')
    }
  }, [service, extension, state]);
  return (
    <div>
      <Loading loading />
      <span style={{ marginLeft: 32 }}>Redirecting...</span>
    </div>
  );
};

const LoginPage = (): JSX.Element => {
  const { service, extension, state = 'roamjs' } = useRouter().query;
  const signInProps = extension
    ? {
        afterSignIn: `${window.location.origin}/extensions/${extension}?started=true&state=${state}`,
        signUpURL: `${window.location.origin}/signup?extension=${extension}&state=${state}`,
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
        <SignedIn>
          <Redirect />
        </SignedIn>
      <SignIn {...signInProps} />
    </Layout>
  );
};

export default LoginPage;
