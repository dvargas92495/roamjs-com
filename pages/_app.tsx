import { AppProps } from "next/app";
import { Body, H2, ThemeProvider, H1, H3, H4, H5, H6 } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Prism } from "react-syntax-highlighter";
import { Auth0Provider } from "@auth0/auth0-react";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import { AUTH0_AUDIENCE, AUTH0_DOMAIN } from "../components/constants";
import useTawkTo from "../components/tawkto";

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

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  useTawkTo();
  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      useRefreshTokens={true}
      cacheLocation={"localstorage"}
      audience={AUTH0_AUDIENCE}
      scope={"read:current_user"}
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
  );
};

export default MyApp;
