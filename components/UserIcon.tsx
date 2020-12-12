import { useAuth0 } from "@auth0/auth0-react";
import { Button, UserAvatar } from "@dvargas92495/ui";
import React, { useCallback } from "react";

const UserIcon = () => {
  const { isAuthenticated, loginWithRedirect, user, isLoading, error } = useAuth0();
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
  console.log("render", isAuthenticated, user, isLoading, error);
  return isAuthenticated ? (
    <UserAvatar name={user.name} avatarUrl={user.picture} />
  ) : (
    <>
      <Button variant="contained" color="primary" onClick={signup}>
        Sign Up
      </Button>
      <Button variant="outlined" color="primary" onClick={login}>
        Log In
      </Button>
    </>
  );
};

export default UserIcon;
