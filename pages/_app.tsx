import { AppProps } from "next/app";
import { ThemeProvider } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { ClerkProvider } from "@clerk/clerk-react";
import "../components/global.css";
import useTawkTo from "../components/tawkto";
import components from "../components/MdxComponents";

const MDXProviderWrapper: React.FunctionComponent<{ pathname: string }> = ({
  pathname,
  children,
}) => {
  return pathname === "/extensions/[id]" ? (
    <>{children}</>
  ) : (
    <MDXProvider components={components}>{children}</MDXProvider>
  );
};

const MyApp = ({ Component, pageProps, router }: AppProps): JSX.Element => {
  useTawkTo();
  return (
    <ClerkProvider frontendApi={process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}>
      <ThemeProvider>
        <MDXProviderWrapper pathname={router.pathname}>
          <Component {...pageProps} />
        </MDXProviderWrapper>
      </ThemeProvider>
    </ClerkProvider>
  );
};

export default MyApp;
