import { SignUp } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef } from "react";
import Layout, { defaultLayoutProps } from "../../components/Layout";

const SignupPage = (): JSX.Element => {
  const { extension, state } = useRouter().query;
  const otherObserverRef = useRef<MutationObserver>(null);
  const errorCallback = useCallback((mr: MutationRecord[]) => {
    const target = mr[0].target as HTMLDivElement;
    if (target.innerText === "has invalid length") {
      target.innerText = "Has invalid length: Must be at least 8 characters.";
    } else if (target.innerText === "is insecure") {
      target.innerText =
        "Password is insecure, it's publicly available. Please choose another";
    }
  }, []);
  const mainCallback = useCallback(
    (_, observer: MutationObserver) => {
      const passwordInput = document.getElementById("password");
      if (passwordInput) {
        const errorNode = passwordInput.nextElementSibling;
        if (errorNode) {
          observer.disconnect();
          otherObserverRef.current = new MutationObserver(errorCallback);
          otherObserverRef.current.observe(errorNode, { attributes: true });
        }
      }
    },
    [errorCallback]
  );
  useEffect(() => {
    const main = document.getElementsByTagName("main")[0];
    if (main) {
      const mutationObserver = new MutationObserver(mainCallback);
      mutationObserver.observe(main, { childList: true, subtree: true });
      return () => {
        mutationObserver.disconnect();
        otherObserverRef.current?.disconnect?.();
      };
    }
  }, [mainCallback]);
  const signUpProps = extension
    ? {
        afterSignUp: `${window.location.origin}/extensions/${extension}?started=true&state=${state}`,
        signInURL: `${window.location.origin}/login?extension=${extension}&state=${state}`,
      }
    : {};
  return (
    <Layout
      title={"Sign Up | RoamJS"}
      description={
        "Sign up on RoamJS to gain access to powerful services for Roam!"
      }
      img={defaultLayoutProps.img}
    >
      <SignUp {...signUpProps} />
    </Layout>
  );
};

export default SignupPage;
