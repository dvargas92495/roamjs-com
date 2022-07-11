import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Root, Main, Footer } from "@dvargas92495/ui";
import dynamic from "next/dynamic";

const PAGES = ["extensions", "contribute", "faq"] as const;

export type LayoutProps = {
  title?: string;
  description?: string;
  img?: string;
  activeLink?: typeof PAGES[number];
};

const UserIconDynamic = dynamic(() => import("../components/UserIcon"), {
  ssr: false,
});

const Layout: React.FunctionComponent<LayoutProps> = ({
  children,
  title = "RoamJS",
  description = "Become a Roam Power User",
  img = "https://roamjs.com/images/logo-low-res.png",
  activeLink,
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
      <header className="static bg-transparent shadow-xl z-10">
        <div className="px-6 h-16 flex items-center">
          <span className="flex max-h-full w-16 mr-4">
            <Link href={"/"}>
              <img
                src={"https://roamjs.com/images/logo-low-res.png"}
                height={"48px"}
                width={"48px"}
                className={"cursor-pointer"}
              />
            </Link>
          </span>
          <div className="justify-start flex-grow flex gap-6 capitalize text-lg items-center h-full">
            {PAGES.map((p, i) => (
              <h6 key={i}>
                <a
                  href={`/${p}`}
                  color="inherit"
                  className={`${
                    activeLink === p ? "text-gray-800" : "text-gray-400"
                  } hover:text-gray-700 active:text-gray-800 hover:no-underline active:no-underline`}
                >
                  {p}
                </a>
              </h6>
            ))}
          </div>
          <div className="w-48 flex justify-end items-center">
            <UserIconDynamic />
          </div>
        </div>
      </header>
      <Main>{children}</Main>
      <Footer
        siteLinks={["About", "Terms of Use", "Privacy Policy", "Contact"]}
      />
    </Root>
  );
};

export default Layout;
