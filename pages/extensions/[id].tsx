import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React, { useCallback, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { serialize } from "../../components/serverSide";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import matter from "gray-matter";
import { idToTitle } from "../../components/hooks";
import {
  Body,
  Breadcrumbs,
  ExternalLink,
  H1,
  H2,
  H3,
  IconButton,
  Subtitle,
  CardGrid,
} from "@dvargas92495/ui";
import getMdxComponents from "../../components/MdxComponents";
import fs from "fs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ExtensionPage = ({
  content,
  id,
  description,
  development,
  githubUrl,
  downloadUrl,
}: {
  id: string;
  content: MDXRemoteSerializeResult;
  description: string;
  development: boolean;
  githubUrl?: string;
  downloadUrl?: string;
}): React.ReactElement => {
  const [randomItems, setRandomItems] = useState([]);
  const total = randomItems.length;
  const title = idToTitle(id);
  const [pagination, setPagination] = useState(0);
  const rowLength = Math.min(4, randomItems.length);
  const onClickLeft = useCallback(
    () => setPagination((pagination - rowLength + total) % total),
    [pagination, setPagination, rowLength]
  );
  const onClickRight = useCallback(
    () => setPagination((pagination + rowLength + total) % total),
    [pagination, setPagination, rowLength]
  );
  useEffect(() => {
    axios.get(`${API_URL}/request-path`).then((r) => {
      const items = r.data.paths
        .filter((p) => p.state !== "PRIVATE" && p.id !== id)
        .map((p) => ({
          image: `https://roamjs.com/thumbnails/${p.id}.png`,
          title: idToTitle(p.id),
          description: p.description,
          href: `/extensions/${p.id}`,
        }))
        .map((item) => ({ item, r: Math.random() }))
        .sort(({ r: a }, { r: b }) => a - b)
        .map(({ item }) => item);
      setRandomItems(items);
    });
  }, [setRandomItems, id]);
  return (
    <StandardLayout
      title={title}
      description={description}
      img={`https://roamjs.com/thumbnails/${id}.png`}
      activeLink={"extensions"}
    >
      <Breadcrumbs
        page={title.toUpperCase()}
        links={[
          {
            text: "EXTENSIONS",
            href: "/extensions",
          },
        ]}
      />
      {development && <H2>UNDER DEVELOPMENT</H2>}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <H1>{title.toUpperCase()}</H1>
        <div style={{ padding: "0 32px", maxWidth: 160 }}>
          <span
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              height: "100%",
            }}
          />
          <img
            src={`https://roamjs.com/thumbnails/${id}.png`}
            className={"thumbnail"}
            style={{
              verticalAlign: "middle",
              width: "100%",
              boxShadow: "0px 3px 14px #00000040",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
      <Subtitle>{description}</Subtitle>
      <hr style={{ marginTop: 28 }} />
      {development ? (
        <>
          <H3>Installation</H3>
          <Body>
            While the extension is under Roam Depot review, users could try out
            the version that will soon be available from Roam Depot by following
            the steps below. Note, this extension has not yet been approved by
            the Roam team.
          </Body>
          <Body>
            Click the button below to download the extension. Unzip the package
            to a new directory. Then in your Roam Depot settings, enable
            developer mode and choose the new directory that you created.
          </Body>
          <a
            className="bg-sky-500 text-white py-2 px-4 rounded-md"
            href={downloadUrl || `/downloads/${id}.zip`}
            download
          >
            Download
          </a>
          <hr style={{ marginTop: 40 }} />
        </>
      ) : (
        <p>
          This extension is available in Roam Depot! Install it directly from
          Roam by navigating to Settings {">"} RoamDepot {">"} Browse. To help
          test a development version of the extension before it's available in
          Roam Depot,{" "}
          <a
            className="text-sky-500 underline"
            href={`https://github.com/dvargas92495/roamjs-${id}/releases/download/latest/${id}.zip`}
            download
          >
            click here to download.
          </a>
        </p>
      )}
      {content.compiledSource ? (
        <MDXRemote {...content} components={getMdxComponents()} />
      ) : (
        "No content"
      )}
      <hr style={{ marginTop: 24 }} />
      <H3>Contributors</H3>
      <Body>
        This extension is brought to you by RoamJS! If you are facing any issues
        reach out to{" "}
        <ExternalLink href={`mailto:support@roamjs.com`}>
          support@roamjs.com
        </ExternalLink>{" "}
        or click on the chat button on the bottom right.
      </Body>
      {githubUrl && (
        <Body>
          Check out the project on{" "}
          <a href={githubUrl} target={"_blank"} rel={"noreferrer"}>
            GitHub!
          </a>
        </Body>
      )}
      <H3>Other Extensions</H3>
      <div
        style={{
          margin: "16px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <IconButton
          icon={"chevronLeft"}
          onClick={onClickLeft}
          style={{ height: 48 }}
        />
        <CardGrid
          items={[
            ...randomItems.slice(pagination, pagination + rowLength),
            ...(pagination + rowLength > total
              ? randomItems.slice(0, pagination + rowLength - total)
              : []),
          ]}
          width={3}
        />
        <IconButton
          icon={"chevronRight"}
          onClick={onClickRight}
          style={{ height: 48 }}
        />
      </div>
    </StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get(`${API_URL}/request-path`)
    .then((r) => ({
      paths: r.data.paths.map(({ id }) => ({
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
    content: MDXRemoteSerializeResult;
    id: string;
    development: boolean;
  },
  {
    id: string;
    subpath: string;
  }
> = (context) =>
  axios
    .get(`${API_URL}/request-path?id=${context.params?.id}`)
    .then(({ data: { content, ...rest } }) => {
      const mdxContent =
        content === "FILE"
          ? fs.existsSync(`pages/docs/extensions/${context.params?.id}.mdx`)
            ? fs
                .readFileSync(`pages/docs/extensions/${context.params?.id}.mdx`)
                .toString()
                .replace(/(.)---\s/s, "$1---\n\n### Usage\n")
            : ""
          : content;
      return { ...matter(mdxContent), ...rest };
    })
    .then(
      ({
        content: preRender,
        state,
        description,
        entry,
        data,
        downloadUrl,
      }) => {
        return serialize(preRender).then((content) => ({
          props: {
            content,
            id: context.params?.id,
            development: state === "DEVELOPMENT" || state === "UNDER REVIEW",
            description,
            downloadUrl,
            ...data,
            entry,
          },
        }));
      }
    )
    .catch((e) => {
      return serialize(
        `Failed to render due to: ${
          typeof e.response?.data === "object"
            ? JSON.stringify(e.response?.data)
            : e.response?.data || e.message
        }`
      ).then((content) => ({
        props: {
          content,
          id: context.params?.id || "",
          development: true,
        },
      }));
    });

export default ExtensionPage;
