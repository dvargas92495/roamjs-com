import { SignedOut } from "@clerk/clerk-react";
import { Loading } from "@dvargas92495/ui";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const Redirect = () => {
  const router = useRouter();
  useEffect(() => {
    router.push('/login');
  }, []);
  return (
    <div>
      <Loading loading />
      <span style={{ marginLeft: 32 }}>Redirecting to login...</span>
    </div>
  );
};

const RedirectToLogin = (): React.ReactElement => {
  return (
    <SignedOut>
      <Redirect />
    </SignedOut>
  );
};

export default RedirectToLogin;
