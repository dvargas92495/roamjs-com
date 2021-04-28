import { AppProps } from "next/app";
import { Body, H2, ThemeProvider, H1, H3, H4, H5, H6 } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Prism } from "react-syntax-highlighter";
import { ClerkProvider } from "@clerk/clerk-react";
import FeatureFlagProvider from "../components/FeatureFlagProvider";
import "../components/global.css";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
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

const InlineCode: React.FunctionComponent = ({ children }) => (
  <code
    style={{ backgroundColor: "#33333320", borderRadius: 4, padding: "0 4px" }}
  >
    {children}
  </code>
);

const MdxImage = (props) => (
  <img
    {...props}
    style={{
      maxWidth: 480,
      boxShadow: "0px 3px 14px #00000040",
      borderRadius: 8,
      margin: "64px auto",
      display: "block",
    }}
  />
);

const MDXProviderWrapper: React.FunctionComponent<{ pathname: string }> = ({
  pathname,
  children,
}) => {
  return pathname === "/extensions/[id]" ? (
    <>{children}</>
  ) : (
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
        inlineCode: InlineCode,
        pre: Pre,
        img: MdxImage,
      }}
    >
      {children}
    </MDXProvider>
  );
};

const MyApp = ({ Component, pageProps, router }: AppProps): JSX.Element => {
  useTawkTo();
  return (
    <ClerkProvider frontendApi={process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}>
      <ThemeProvider>
        <MDXProviderWrapper pathname={router.pathname}>
          <FeatureFlagProvider>
            <Component {...pageProps} />
          </FeatureFlagProvider>
        </MDXProviderWrapper>
      </ThemeProvider>
    </ClerkProvider>
  );
};

export default MyApp;
