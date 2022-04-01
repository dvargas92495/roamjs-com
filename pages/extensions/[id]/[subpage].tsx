import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import { serialize } from "../../../components/serverSide";
import React from "react";
import { API_URL } from "../../../components/constants";
import StandardLayout from "../../../components/StandardLayout";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Breadcrumbs, H1, H2 } from "@dvargas92495/ui";
import { idToTitle } from "../../../components/hooks";
import getMdxComponents from "../../../components/MdxComponents";

type ExtensionSubPageProps = {
  content: MDXRemoteSerializeResult;
  id: string;
  subpage: string;
  development: boolean;
  premium: {
    description: string;
    price: number;
    usage: "licensed" | "metered";
    quantity: number;
  } | null;
};

const ExtensionSubPage = ({
  content,
  id,
  subpage,
  development,
  premium,
}: ExtensionSubPageProps): React.ReactElement => {
  const title = idToTitle(subpage);
  return (
    <StandardLayout
      title={`${title} | ${idToTitle(id)}`}
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
      {development && <H2>UNDER DEVELOPMENT</H2>}
      <H1>{title.toUpperCase()}</H1>
      <MDXRemote
        {...content}
        components={getMdxComponents({
          id,
          premium,
        })}
      />
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
          development: r.data.state !== "LIVE",
          premium: r.data.premium || null,
          ...context.params,
        },
      }))
    )
    .catch((e) =>
      serialize(
        `Failed to render due to: ${
          e.response?.data
            ? typeof e.response.data === "string"
              ? e.response.data
              : JSON.stringify(e.response?.data)
            : e.message
        }`
      ).then((content) => ({
        props: {
          content,
          development: true,
          premium: null,
          ...context.params,
        },
      }))
    );

export default ExtensionSubPage;
