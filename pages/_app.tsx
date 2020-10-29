import { AppProps } from "next/app";
import Image from "next/image";
import { Body, H2, ThemeProvider, H1, H3, H4, H5, H6 } from "@dvargas92495/ui";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Prism } from "react-syntax-highlighter";

const Li = ({ children, ...props }: { children: React.ReactNode }) => (
  <li {...props}>
    <Body>{children}</Body>
  </li>
);

const Pre: React.FunctionComponent<HTMLPreElement> = ({ children }) => (
  <>{children}</>
);

const Code: React.FunctionComponent<HTMLElement> = ({
  className,
  children,
}) => {
  return (
    <Prism language={(className || "").substring("language-".length)}>
      {children}
    </Prism>
  );
};

const MdxImage = (props) => (
  <Image unsized {...props} style={{ maxWidth: "100%" }} />
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
        code: Code,
        pre: Pre,
        li: Li,
        img: MdxImage,
      }}
    >
      <Component {...pageProps} />
    </MDXProvider>
  </ThemeProvider>
);

export default MyApp;
