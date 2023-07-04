import React from "react";
import Head from "next/head";
import Link from "next/link";

const Footer = ({ siteLinks }: { siteLinks: string[] }) => {
  return (
    <footer
      style={{
        padding: "24px 16px",
        marginTop: "32px",
        background: "#f8a94a40",
      }}
    >
      <hr />
      <div className="flex gap-64">
        <div>
          <p>
            {"\u00A9"} {new Date().getFullYear()}{" "}
            <a href="https://samepage.network" target="_blank" rel="noreferrer">
              SamePage Network, Inc.
            </a>
          </p>
        </div>
        <div>
          <h6 className="text-xl font-bold mb-2">Site Links</h6>
          {siteLinks.map((l, i) => {
            return (
              <p key={i}>
                <Link href={`/${l.toLowerCase().replace(/ /g, "-")}`}>{l}</Link>
              </p>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

const PAGES = ["extensions", "FAQ"] as const;

export type LayoutProps = {
  title?: string;
  description?: string;
  img?: string;
  activeLink?: (typeof PAGES)[number];
};

const Layout: React.FunctionComponent<LayoutProps> = ({
  children,
  title = "RoamJS",
  description = "Become a Roam Power User",
  img = "https://roamjs.com/images/logo-low-res.png",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
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
        <div className="px-6 h-16 flex items-center justify-between">
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
        </div>
      </header>
      <main
        className="my-8"
        style={{
          marginLeft: 0,
          marginRight: 0,
          display: "flex",
          justifyContent: "center",
          width: "100%",
          padding: 0,
          flexGrow: 1,
        }}
      >
        {children}
      </main>
      <Footer
        siteLinks={[
          "About",
          "FAQ",
          "Terms of Use",
          "Privacy Policy",
          "Contact",
        ]}
      />
    </div>
  );
};

export default Layout;
