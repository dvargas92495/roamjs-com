import { useAuth0 } from "@auth0/auth0-react";
import { AddUser, Body, Button, UserAvatar } from "@dvargas92495/ui";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useState } from "react";

const ConvertKitComponent = () => {
  const Component = dynamic(() => import("../components/ConvertKit"), {	 
    ssr: false,
  });	
  return <Component />;	
};

const UserIcon: React.FunctionComponent = () => {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key.toLowerCase() === "u") {
        setFlag(e.shiftKey);
      }
    });
  }, [setFlag]);
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const login = useCallback(
    () =>
      loginWithRedirect({
        redirectUri: `${window.location.origin}/user`,
        audience: "https://vargas-arts.us.auth0.com/api/v2/",
      }),
    [loginWithRedirect]
  );
  const signup = useCallback(
    () =>
      loginWithRedirect({
        redirectUri: `${window.location.origin}/user`,
        audience: "https://vargas-arts.us.auth0.com/api/v2/",
        screen_hint: "signup",
      }),
    [loginWithRedirect]
  );
  return isAuthenticated ? (
    <UserAvatar name={user.name} avatarUrl={user.picture} />
  ) : flag ? (
    <div style={{width: 200, display: 'flex', justifyContent: 'space-between'}}>
      <Button variant="contained" color="primary" onClick={signup}>
        Sign Up
      </Button>
      <Button variant="outlined" color="primary" onClick={login}>
        Log In
      </Button>
    </div>
  ) : (
    <AddUser buttonText={"Subscribe"} title="ROAMJS DIGEST">
      <Body>
        Add your email below to stay up to date on all RoamJS features, fixes,
        and news!
      </Body>
      <ConvertKitComponent />
    </AddUser>
  );
};

export default UserIcon;
