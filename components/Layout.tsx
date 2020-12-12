import React from "react";
import Head from "next/head";
import {
  AppBar,
  Root,
  Main,
  Footer,
} from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";
import dynamic from "next/dynamic";

const UserIconAuth0 = dynamic(() => import("../components/UserIcon"), {
  ssr: false,
});

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Root>
      <Head>
        <title>Roam JS</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar
        homeIcon={<RoamJSLogo />}
        userIcon={<UserIconAuth0 />}
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
