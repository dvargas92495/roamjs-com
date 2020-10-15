import React from "react";
import Head from "next/head";
import { AppBar } from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Head>
      <title>Roam JS</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <AppBar homeIcon={<RoamJSLogo size={2} />} pages={["about", "docs"]} />
    <main
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {children}
    </main>
    <footer>
      <hr />
      <span>© {new Date().getFullYear()} Vargas Arts, LLC</span>
    </footer>
  </div>
);

export default Layout;
