import { SignUp } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef } from "react";
import Layout from "../../components/Layout";

const SignupPage = (): JSX.Element => {
  const { service } = useRouter().query;
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

export default SignupPage;
