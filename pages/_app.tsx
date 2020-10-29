import { AppProps } from "next/app";
import { Body, H2, ThemeProvider, H1, H3, H4, H5, H6 } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";

const Li = ({ children, ...props }: { children: React.ReactNode }) => (
  <li {...props}>
    <Body>{children}</Body>
  </li>
);

const MyApp = ({ Component, pageProps }: AppProps) => (
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
        li: Li,
      }}
    >
      <Component {...pageProps} />
    </MDXProvider>
  </ThemeProvider>
);

export default MyApp;
