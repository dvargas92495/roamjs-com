import { AppProps } from "next/app";
import { ThemeProvider } from "@dvargas92495/ui";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <ThemeProvider>
    <Component {...pageProps} />
  </ThemeProvider>
);

export default MyApp;
