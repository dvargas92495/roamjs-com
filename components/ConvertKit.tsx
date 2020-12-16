import Head from "next/head";
import React, { useEffect, useState } from "react";

const ConvertKit: React.FunctionComponent = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, [setLoaded]);
  return (
    <>
      {!loaded && (
        <Head>
          <script
            async
            src="https://prodigious-trader-7332.ck.page/a85e477729/index.js"
          />
        </Head>
      )}
      <script data-uid="a85e477729" />
    </>
  );
};

export default ConvertKit;
