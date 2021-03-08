import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { AddUser, Body, Button } from "@dvargas92495/ui";
import dynamic from "next/dynamic";
import React from "react";

const ConvertKitComponent = () => {
  const Component = dynamic(() => import("../components/ConvertKit"), {
    ssr: false,
  });
  return <Component />;
};

const UserIcon: React.FC<{ flag: boolean }> = ({ flag }) => {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        {flag ? (
          <>
            <Button color={"primary"} href={"/login"}>
              LOGIN
            </Button>
            <Button color={"secondary"} href={"/signup"}>
              SIGNUP
            </Button>
          </>
        ) : (
          <AddUser buttonText={"Subscribe"} title="ROAMJS DIGEST">
            <Body>
              Add your email below to stay up to date on all RoamJS features,
              fixes, and news!
            </Body>
            <ConvertKitComponent />
          </AddUser>
        )}
      </SignedOut>
    </>
  );
};

export default UserIcon;
