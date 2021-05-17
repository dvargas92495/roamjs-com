import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import { serialize } from "next-mdx-remote/serialize";
import React from "react";
import { API_URL } from "../../../components/constants";
import StandardLayout from "../../../components/StandardLayout";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import MdxComponents from "../../../components/MdxComponents";
import { Breadcrumbs, H1 } from "@dvargas92495/ui";
import { idToTitle } from "../../../components/hooks";

type ExtensionSubPageProps = {
  content: MDXRemoteSerializeResult;
  id: string;
  subpage: string;
};

const ExtensionSubPage = ({
  content,
  id,
  subpage,
}: ExtensionSubPageProps): React.ReactElement => {
  const title = idToTitle(subpage);
  return (
    <StandardLayout
      title={`${subpage} | ${id}`}
      description={`${title} page of the ${idToTitle(id)} extension.`}
      img={`https://roamjs.com/thumbnails/${id}.png`}
    >
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
      <MDXRemote {...content} components={MdxComponents} />
    </StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get(`${API_URL}/request-path?sub=true`)
    .then((r) => ({
      paths: r.data.paths.map((params) => ({
        params,
      })),
      fallback: false,
    }))
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
      serialize(r.data.content).then((content) => ({
        props: {
          content,
          ...context.params,
        },
      }))
    )
    .catch((e) =>
      serialize(
        `Failed to render due to: ${e.response?.data || e.message}`
      ).then((content) => ({
        props: {
          content,
          ...context.params,
        },
      }))
    );

export default ExtensionSubPage;
