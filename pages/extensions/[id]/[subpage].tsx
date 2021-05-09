import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import renderToString from "next-mdx-remote/render-to-string";
import { MdxRemote } from "next-mdx-remote/types";
import React from "react";
import { API_URL } from "../../../components/constants";
import { defaultLayoutProps } from "../../../components/Layout";
import StandardLayout from "../../../components/StandardLayout";
import hydrate from "next-mdx-remote/hydrate";
import MdxComponents from "../../../components/MdxComponents";
import { Breadcrumbs, H1 } from "@dvargas92495/ui";
import { idToTitle } from "../../../components/hooks";

type ExtensionSubPageProps = {
  content: MdxRemote.Source;
  id: string;
  subpage: string;
};

const ExtensionSubPage = ({
  content,
  id,
  subpage,
}: ExtensionSubPageProps): React.ReactElement => {
  const children = hydrate(content, { components: MdxComponents });
  const title = idToTitle(subpage);
  return (
    <StandardLayout {...defaultLayoutProps} title={`${subpage} | ${id}`}>
      <Breadcrumbs
        page={title.toUpperCase()}
        links={[
          {
            text: "EXTENSIONS",
            href: "/extensions",
          },
          {
            text: id.toUpperCase(),
            href: `/extensions/${id}`,
          },
        ]}
      />
      <H1>{title.toUpperCase()}</H1>
      {children}
    </StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get(`${API_URL}/request-path?sub=true`)
    .then((r) => {
      console.log(r.data.paths);
      return {
        paths: r.data.paths.map((params) => ({
          params,
        })),
        fallback: false,
      };
    })
    .catch(() => ({
      paths: [],
      fallback: false,
    }));

export const getStaticProps: GetStaticProps<
  ExtensionSubPageProps,
  {
    id: string;
    subpage: string;
  }
> = (context) =>
  axios
    .get(
      `${API_URL}/request-path?id=${context.params.id}/${context.params.subpage}`
    )
    .then((r) =>
      renderToString(r.data.content, { components: MdxComponents }).then(
        (content) => ({
          props: {
            content,
            ...context.params,
          },
        })
      )
    )
    .catch((e) => ({
      props: {
        content: {
          compiledSource: "",
          renderedOutput: `Failed to load ${context.params.id}/${
            context.params.subpage
          } due to error ${JSON.stringify(e)}`,
        },
        ...context.params,
      },
    }));

export default ExtensionSubPage;
