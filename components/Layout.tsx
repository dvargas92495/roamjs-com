import React from "react";
import Head from "next/head";
import { AddUser, AppBar, Root, Main, Footer, Body, H4 } from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";

const UserIcon = () => (
  <AddUser buttonText={"Subscribe"} title="ROAMJS DIGEST">
    <Head>
      <script
        async
        src="https://prodigious-trader-7332.ck.page/a85e477729/index.js"
      />
    </Head>
    <Body>
      Add your email below to stay up to date on all RoamJS features, fixes, and
      news!
    </Body>
    <script data-uid="a85e477729" />
  </AddUser>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Root>
    <Head>
      <title>Roam JS</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <AppBar
      homeIcon={<RoamJSLogo />}
      userIcon={<UserIcon />}
      pages={["docs", "automations", "queue", "contribute"]}
    />
    <Main>{children}</Main>
    <Footer 
      siteLinks={[
        "About",
        "Terms of Use",
        "Privacy Policy",
        "Contact",
      ]}
    />
  </Root>
);

export default Layout;
