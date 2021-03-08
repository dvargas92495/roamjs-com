import React from "react";
import Head from "next/head";
import { AppBar, Root, Main, Footer } from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";
import dynamic from "next/dynamic";
import { useFlag } from "./FeatureFlagProvider";

const UserIconDynamic = dynamic(() => import("../components/UserIcon"), {
  ssr: false,
});

const Layout: React.FunctionComponent = ({ children }) => {
  const flag = useFlag();
  return (
    <Root>
      <Head>
        <title>RoamJS</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar
        homeIcon={<RoamJSLogo />}
        userIcon={<UserIconDynamic flag={flag} />}
        pages={
          flag
            ? ["docs", "services", "queue", "contribute"]
            : ["docs", "queue", "freelancing", "contribute"]
        }
      />
      <Main>{children}</Main>
      <Footer
        siteLinks={["About", "Terms of Use", "Privacy Policy", "Contact"]}
      />
    </Root>
  );
};

export default Layout;
