import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import { Prism } from "react-syntax-highlighter";
import React, { useCallback, useState } from "react";
import { API_URL } from "../../components/constants";
import StandardLayout from "../../components/StandardLayout";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import matter from "gray-matter";
import {
  getSingleCodeContent,
  idToTitle,
  useCopyCode,
} from "../../components/hooks";
import {
  Body,
  Breadcrumbs,
  Button,
  ExternalLink,
  H1,
  H2,
  H3,
  H4,
  IconButton,
  Subtitle,
  Tooltip,
} from "@dvargas92495/ui";
import {
  contributors as allContributors,
  emojisToTooltip,
  SponsorDialog,
} from "../../components/ExtensionPageLayout";
import RoamJSDigest from "../../components/RoamJSDigest";
import MdxComponents from "../../components/MdxComponents";

const total = 30 - 1;
const rowLength = 4;

const ExtensionPage = ({
  content,
  id,
  description,
  development,
  contributors,
}: {
  id: string;
  content: MDXRemoteSerializeResult;
  description: string;
  development: boolean;
  contributors?: string;
}): React.ReactElement => {
  const title = idToTitle(id);
  const [copied, setCopied] = useState(false);
  const onSave = useCopyCode(setCopied);
  const [pagination, setPagination] = useState(0);
  const onClickLeft = useCallback(
    () => setPagination((pagination - rowLength + total) % total),
    [pagination, setPagination]
  );
  const onClickRight = useCallback(
    () => setPagination((pagination + rowLength + total) % total),
    [pagination, setPagination]
  );
  return (
    <StandardLayout
      title={title}
      description={description}
      img={`https://roamjs.com/thumbnails/${id}.png`}
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
      <H1>{title.toUpperCase()}</H1>
      <Subtitle>{description}</Subtitle>
      <H3>Installation</H3>
      <Body>
        You could use the Copy Extension button below to individually install
        this extension. To install, just paste anywhere in your Roam graph and
        click "Yes, I Know What I'm Doing".
      </Body>
      <div style={{ marginBottom: 24 }}>
        <Button
          onClick={() => onSave([`${id}/main`])}
          color="primary"
          variant="contained"
        >
          COPY EXTENSION
        </Button>
        {copied && <span style={{ marginLeft: 24 }}>COPIED!</span>}
      </div>
      <H4>Manual Installation</H4>
      <Body>
        If instead you prefer to manually install, first create a <b>block</b>{" "}
        with the text <code>{"{{[[roam/js]]}}"}</code> on any page in your Roam
        DB. Then, copy and paste this code block as a child of the block.
      </Body>
      <div style={{ marginBottom: 48 }}>
        <Prism language="javascript">
          {getSingleCodeContent(`${id}/main`)}
        </Prism>
      </div>
      <MDXRemote {...content} components={MdxComponents} />
      <H3>Contributors</H3>
      <Body>
        This extension is brought to you by RoamJS! If you are facing any issues
        reach out to{" "}
        <ExternalLink href={"mailto:support@roamjs.com"}>
          support@roamjs.com
        </ExternalLink>{" "}
        or click on the chat button on the bottom right. If you get value from
        using this extension, consider sponsoring RoamJS by clicking on the
        button below!
      </Body>
      <SponsorDialog id={id} />
      {contributors?.length && (
        <>
          <Body>
            A special thanks to those who's contributions also helped make this
            extension possible:
          </Body>
          <ul>
            {contributors.split(",").map((s) => {
              const parts = s.trim().split(" ");
              const name = parts.slice(0, parts.length - 1).join(" ");
              const emojis = parts[parts.length - 1];
              const href = allContributors[name];
              return (
                <li key={s}>
                  {href ? (
                    <>
                      <ExternalLink href={href}>{name}</ExternalLink>
                    </>
                  ) : (
                    name
                  )}{" "}
                  {emojis
                    .split("")
                    .map((s, i) => `${s}${emojis.charAt(i + 1)}`)
                    .filter((_, i) => i % 2 === 0)
                    .filter((s) => !!emojisToTooltip[s])
                    .map((s) => (
                      <Tooltip title={emojisToTooltip[s]} key={s}>
                        <span style={{ cursor: "help" }}>{s}</span>
                      </Tooltip>
                    ))}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div style={{ margin: "128px 0" }}>
        <div style={{ width: "100%", textAlign: "center" }}>
          <RoamJSDigest />
        </div>
      </div>
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
        {/*
        <CardGrid
          items={[
            ...randomItems.slice(pagination, pagination + rowLength),
            ...(pagination + rowLength > total
              ? randomItems.slice(0, pagination + rowLength - total)
              : []),
          ]}
          width={3}
        />*/}
        <span>Coming Soon...</span>
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
    .get(`${API_URL}/request-path?id=${context.params.id}`)
    .then((r) => matter(r.data.content))
    .then(({ content: preRender, data }) =>
      serialize(preRender).then((content) => ({
        props: {
          content,
          id: context.params.id,
          // Query a data source for this as a way to verify extensions
          development: false,
          ...data,
        },
      }))
    )
    .catch((e) => ({
      props: {
        content: {
          compiledSource: "",
          renderedOutput: `Failed to load ${
            context.params.id
          } due to error ${JSON.stringify(e)}`,
        },
        id: context.params.id,
        development: true,
      },
    }));

export default ExtensionPage;
