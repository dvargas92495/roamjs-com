import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@dvargas92495/ui";
import React from "react";

const UserIcon = (): React.ReactElement => {
  return (
    <>
      <SignedIn>
        <UserButton />
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
