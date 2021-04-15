import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@dvargas92495/ui";
import React, { useEffect } from "react";
import { useAuthenticatedAxiosPut } from "./hooks";

const UserButtonSignedIn = () => {
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  useEffect(() => {
    authenticatedAxiosPut("customer").catch((e) =>
      console.error(e.response?.data || e.message)
    );
  }, [authenticatedAxiosPut]);
  return <UserButton />;
};

const UserIcon: React.FC<{ flag: boolean }> = () => {
  return (
    <>
      <SignedIn>
        <UserButtonSignedIn />
      </SignedIn>
      <SignedOut>
        <Button
          color={"primary"}
          href={"/login"}
          variant={"outlined"}
          style={{ margin: "0 4px" }}
        >
          LOGIN
        </Button>
        <Button
          color={"secondary"}
          href={"/signup"}
          variant={"outlined"}
          style={{ marginLeft: 4, marginRight: 8 }}
        >
          SIGNUP
        </Button>
      </SignedOut>
    </>
  );
};

export default UserIcon;
