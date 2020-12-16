import React from "react";
import Head from "next/head";

const AddStyle: React.FunctionComponent<{ styleContent: string }> = ({
  styleContent,
}) => (
  <Head>
    <style>{styleContent}</style>
  </Head>
);

export default AddStyle;
