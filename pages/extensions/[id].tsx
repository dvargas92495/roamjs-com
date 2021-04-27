import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React from "react";
import { defaultLayoutProps } from "../../components/Layout";
import StandardLayout from "../../components/StandardLayout";

const ExtensionPage = ({ id }: { id: string }): React.ReactElement => {
  return (
    <StandardLayout {...defaultLayoutProps}>{id} Coming soon...</StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get("request-path")
    .then((r) => ({
      paths: r.data.paths.map((id) => ({
        params: {
          id,
        },
      })),
      fallback: false,
    }))
    .catch(() => ({
      paths: [],
      fallback: false,
    }));

export const getStaticProps: GetStaticProps<
  {
    id: string;
  },
  {
    id: string;
  }
> = async (context) => ({
  props: context.params,
});

export default ExtensionPage;
