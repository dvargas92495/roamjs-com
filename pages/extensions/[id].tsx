import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React from "react";
import { API_URL } from "../../components/constants";
import { defaultLayoutProps } from "../../components/Layout";
import StandardLayout from "../../components/StandardLayout";
import renderToString from "next-mdx-remote/render-to-string";
import hydrate from "next-mdx-remote/hydrate";
import type { MdxRemote } from "next-mdx-remote/types";

const ExtensionPage = ({
  content,
}: {
  content: MdxRemote.Source;
}): React.ReactElement => {
  const children = hydrate(content, {});
  return <StandardLayout {...defaultLayoutProps}>{children}</StandardLayout>;
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get(`${API_URL}/request-path`)
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
    content: MdxRemote.Source;
  },
  {
    id: string;
  }
> = (context) =>
  axios
    .get(`${API_URL}/request-path?id=${context.params.id}`)
    .then((r) => renderToString(r.data.content, {}))
    .then((content) => ({
      props: { content },
    }))
    .catch((e) => ({
      props: {
        content: {
          compiledSource: "",
          renderedOutput: `Failed to load ${
            context.params.id
          } due to error ${JSON.stringify(e)}`,
        },
      },
    }));

export default ExtensionPage;
