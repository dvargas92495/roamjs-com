import { AppProps } from "next/app";
import { ThemeProvider } from "@dvargas92495/ui";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <ThemeProvider>
    <style global jsx>{`
      body {
        margin: 0;
      }
    `}</style>
    <Component {...pageProps} />
  </ThemeProvider>
);

export default MyApp;
