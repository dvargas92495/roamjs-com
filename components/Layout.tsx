import React from "react";
import Head from "next/head";
import { AppBar, Root, Main, Footer } from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Root>
    <Head>
      <title>Roam JS</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <AppBar homeIcon={<RoamJSLogo size={2} />} pages={["about", "docs"]} />
    <Main>
      {children}
    </Main>
    <Footer/>
  </Root>
);

export default Layout;
