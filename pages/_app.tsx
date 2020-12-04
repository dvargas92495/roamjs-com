import { AppProps } from "next/app";
import { Body, H2, ThemeProvider, H1, H3, H4, H5, H6 } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Prism } from "react-syntax-highlighter";
import { Auth0Provider } from "@auth0/auth0-react";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import { UserProvider } from "react-manage-users";

const Pre: React.FunctionComponent<HTMLPreElement> = ({ children }) => (
  <>{children}</>
);

const Code: React.FunctionComponent<HTMLElement> = ({
  className,
  children,
}) => {
  return (
    <Prism language={(className || "").substring("language-".length)}>
      {typeof children === "string" ? children.trim() : children}
    </Prism>
  );
};

const MdxImage = (props) => <img {...props} style={{ maxWidth: 480 }} />;

const MyApp = ({ Component, pageProps }: AppProps) => (
  <UserProvider
    autoLoginConfig={[
      {
        getToken: () =>
          localStorage.getItem("roamToken") ||
          process.env.NEXT_PUBLIC_ROAM_TOKEN ||
          "",
        getUser: () =>
          Promise.resolve({
            name: "David Vargas",
            email: "dvargas92495@gmail.com",
            avatarUrl: "unused.png",
          }),
      },
    ]}
    handleError={console.error}
  >
    <Auth0Provider
      domain="vargas-arts.us.auth0.com"
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      audience="https://vargas-arts.us.auth0.com/api/v2/"
    >
      <ThemeProvider>
        <MDXProvider
          components={{
            h1: H1,
            h2: H2,
            h3: H3,
            h4: H4,
            h5: H5,
            h6: H6,
            p: Body,
            code: Code,
            pre: Pre,
            img: MdxImage,
          }}
        >
          <Component {...pageProps} />
        </MDXProvider>
      </ThemeProvider>
    </Auth0Provider>
  </UserProvider>
);

export default MyApp;
