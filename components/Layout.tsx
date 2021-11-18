import React from "react";
import Head from "next/head";
import { AppBar, Root, Main, Footer } from "@dvargas92495/ui";
import RoamJSLogo from "./RoamJSLogo";
import dynamic from "next/dynamic";

export type LayoutProps = {
  title: string;
  description: string;
  img: string;
};

export const defaultLayoutProps = {
  title: "RoamJS",
  description: "Become a Roam Power User",
  img: "https://roamjs.com/images/logo-high-res.jpg",
};

const UserIconDynamic = dynamic(() => import("../components/UserIcon"), {
  ssr: false,
});

const Layout: React.FunctionComponent<LayoutProps> = ({
  children,
  title,
  description,
  img,
}) => {
  return (
    <Root>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content={"summary"} />
        <meta name="twitter:creator" content="@dvargas92495" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="og:image" content={img} />
        <meta name="twitter:image" content={img} />
      </Head>
      <AppBar
        homeIcon={<RoamJSLogo />}
        userIcon={<UserIconDynamic />}
        pages={["extensions", "projects", "queue", "contribute"]}
      />
      <Main>{children}</Main>
      <Footer
        siteLinks={["About", "Terms of Use", "Privacy Policy", "Contact"]}
      />
    </Root>
  );
};

export default Layout;
