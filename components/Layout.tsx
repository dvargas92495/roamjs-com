import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import {
  AddUser,
  AppBar,
  Root,
  Main,
  Footer,
  Body,
  UserAvatar,
  Button,
} from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "react-manage-users";
import dynamic from "next/dynamic";

const ConvertKitComponent = dynamic(() => import("../components/ConvertKit"), {
  ssr: false,
});

const UserIcon = () => {
  const user = useUser();
  return user ? (
    <UserAvatar {...user} />
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

const UserIconAuth0 = () => {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const login = useCallback(
    () =>
      loginWithRedirect({
        redirectUri: `${window.location.origin}/user`,
        audience: "https://vargas-arts.us.auth0.com/api/v2/",
      }),
    [loginWithRedirect]
  );
  return isAuthenticated ? (
    <UserAvatar name={user.name} avatarUrl={user.picture} />
  ) : (
    <>
      <Button variant="contained" color="primary">
        Sign Up
      </Button>
      <Button variant="outlined" color="primary" onClick={login}>
        Log In
      </Button>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key.toLowerCase() === "u") {
        setFlag(e.shiftKey);
      }
    });
  }, [setFlag]);
  return (
    <Root>
      <Head>
        <title>Roam JS</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar
        homeIcon={<RoamJSLogo />}
        userIcon={flag ? <UserIconAuth0 /> : <UserIcon />}
        pages={["docs", "automations", "queue", "contribute"]}
      />
      <Main>{children}</Main>
      <Footer
        siteLinks={["About", "Terms of Use", "Privacy Policy", "Contact"]}
      />
    </Root>
  );
};

export default Layout;
