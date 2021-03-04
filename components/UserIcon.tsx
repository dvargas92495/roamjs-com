import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { AddUser, Body } from "@dvargas92495/ui";
import dynamic from "next/dynamic";
import React from "react";

const ConvertKitComponent = () => {
  const Component = dynamic(() => import("../components/ConvertKit"), {
    ssr: false,
  });
  return <Component />;
};

const UserIcon: React.FunctionComponent = () => {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <AddUser buttonText={"Subscribe"} title="ROAMJS DIGEST">
          <Body>
            Add your email below to stay up to date on all RoamJS features,
            fixes, and news!
          </Body>
          <ConvertKitComponent />
        </AddUser>
      </SignedOut>
    </>
  );
};

export default UserIcon;
