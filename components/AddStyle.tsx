import React from "react";
import Head from "next/head";

const AddStyle = ({ styleContent }: { styleContent: string }) => (
  <Head>
    <style>{styleContent}</style>
  </Head>
);

export default AddStyle;
