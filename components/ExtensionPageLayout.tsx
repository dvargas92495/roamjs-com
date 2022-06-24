import {
  Body,
  Breadcrumbs,
  Button,
  CardGrid,
  ExternalLink,
  H1,
  H2,
  H3,
  H4,
  IconButton,
  Subtitle,
  Tooltip,
} from "@dvargas92495/ui";
import React, { useCallback, useMemo, useState } from "react";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";
import Loom from "./Loom";
import { frontMatter as frontMatters } from "../pages/docs/extensions/*.mdx";
import { getSingleCodeContent, idToTitle, useCopyCode } from "./hooks";
import StandardLayout from "./StandardLayout";
import RoamJSDigest from "./RoamJSDigest";
import SponsorDialog from "./SponsorDialog";
import { isSafari } from "react-device-detect";

export interface FrontMatter {
  __resourcePath: string;
  description: string;
  development?: boolean;
  acknowledgements?: string;
  loom?: string;
  contributors?: string;
  skipDemo?: boolean;
}

export const pathToId = (f: string): string =>
  f.substring("docs\\extensions\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string): string =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const INDEX_LABEL = "Getting Started";

export const items = (frontMatters as FrontMatter[]).map((f) => ({
  title: pathToLabel(f.__resourcePath)
    .split(" ")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" "),
  description: f.description,
  image: `/thumbnails/${pathToId(f.__resourcePath)}.png`,
  href: `/${f.__resourcePath.replace(/\.mdx$/, "")}`,
  development: !!f.development,
}));
const prodItems = items.filter((f) => !f.development);

const total = prodItems.length - 1;
const rowLength = 4;

export const contributors = {
  "Rodrigo Franco": "https://www.rodrigofranco.com/",
  "David Chelimsky": "http://blog.davidchelimsky.net/",
  "Tomáš Baránek": "https://twitter.com/tombarys",
  "Abhay Prasanna": "https://twitter.com/AbhayPrasanna",
  "Brandon Toner": "https://brandontoner.substack.com/",
  "Conor White-Sullivan": "https://twitter.com/Conaw",
  "Matt Brockwell": "https://twitter.com/Jeanvaljean689",
  "Eddie Cohen": "https://eddiecohen.com/",
  "Rushi Bhavsar": "https://twitter.com/RushiBhavsar",
  RoamHacker: "https://twitter.com/roamhacker",
  "Ivo Velitchkov": "https://www.strategicstructures.com/",
  "Mathew McGann": "http://www.mcgannfreestone.com.au/",
  "Bardia Pourvakil": "https://twitter.com/thepericulum",
  "Gene Kim": "https://twitter.com/RealGeneKim",
  "Tony Ennis": "https://tonyennis.com",
  "Sharon Dale": "http://www.sharondale.co.uk/",
  "Eric Anderson": "http://ecanderson.com/",
  "Zach Phillips": "https://zachphillips.blog/",
  "Isabela Granic": "http://isabelagranic.com/",
  "Joe Ocampo": "https://twitter.com/joe_ocampo",
  "Jon Surrat": "https://twitter.com/surrjon",
  "Owen Cyrulnik": "https://twitter.com/cyrulnik",
  "Elizabeth Brott Beese": "https://elizabethbeese.com",
  "Aneesh Makala": "https://twitter.com/makalaaneesh",
  "Marco Brambilla": "https://github.com/marcobrambilla",
  "David Schulman": "https://associationsrewired.com/",
  "Scott Block": "https://twitter.com/insidetheblock",
  "Dave Prout": "https://twitter.com/Prouticus",
  "Amanda Peyton": "http://amandapeyton.com/",
  "Daniel Rahal": "https://twitter.com/danhrahal",
  "Orkhan Allahverdi": "https://twitter.com/o_allahverdi",
  "Monty Kosma": "https://twitter.com/mkosma",
  "Mark Robertson": "https://twitter.com/calhistorian",
};

export const emojisToTooltip = {
  "💵": "Financial",
  "📓": "Testing",
  "🤔": "Idea",
  "💻": "Code",
  "📖": "Documentation",
};

const ExtensionPageLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children, frontMatter }) => {
  const id = pathToId(frontMatter.__resourcePath);
  const label = pathToLabel(frontMatter.__resourcePath).toUpperCase();
  const [copied, setCopied] = useState(false);
  const onSave = useCopyCode(setCopied);

  const randomItems = useMemo(
    () =>
      prodItems
        .filter((a) => a.title.toUpperCase() !== label)
        .map((a, i) => ({
          sort:
            a.title.toUpperCase().localeCompare(label) < 0
              ? i + prodItems.length - 1
              : i,
          value: a,
        }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value),
    [label]
  );
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
      title={idToTitle(id)}
      description={frontMatter.description}
      img={`https://roamjs.com/thumbnails/${id}.png`}
      activeLink={"extensions"}
    >
      <Breadcrumbs
        page={label}
        links={[
          {
            text: "EXTENSIONS",
            href: "/docs",
          },
        ]}
      />
      {frontMatter.development && <H2>UNDER DEVELOPMENT</H2>}
      <H1>{label}</H1>
      <Subtitle>{frontMatter.description}</Subtitle>
      <H3>Installation</H3>
      {!isSafari && (
        <>
          <Body>
            You could use the Copy Extension button below to individually
            install this extension. To install, just paste anywhere in your Roam
            graph and click "Yes, I Know What I'm Doing".
          </Body>
          <div style={{ marginBottom: 24 }}>
            <Button
              onClick={() => onSave(id)}
              color="primary"
              variant="contained"
            >
              COPY EXTENSION
            </Button>
            {copied && <span style={{ marginLeft: 24 }}>COPIED!</span>}
          </div>
          <H4>Manual Installation</H4>
          <Body>
            If the extension doesn't work after using the copy extension button
            above, try installing manually using the instructions below.
          </Body>
        </>
      )}
      <Body>
        First create a <b>block</b> with the text{" "}
        <code>{"{{[[roam/js]]}}"}</code> on any page in your Roam DB. Then,
        create a single child of this block type three back ticks. A code block
        should appear. Copy this code and paste it into the child code block in
        your graph:
      </Body>
      <Prism language="javascript">{getSingleCodeContent(id)}</Prism>
      <Body>Finally, click "Yes, I Know What I'm Doing".</Body>
      <H3>Usage</H3>
      {children}
      {(!frontMatter.development || frontMatter.loom) && !frontMatter.skipDemo && (
        <>
          <H3>Demo</H3>
          {frontMatter.loom ? (
            <Loom id={frontMatter.loom} />
          ) : (
            <DemoVideo src={pathToId(frontMatter.__resourcePath)} />
          )}
        </>
      )}
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
      {frontMatter.contributors && (
        <>
          <Body>
            A special thanks to those who's contributions also helped make this
            extension possible:
          </Body>
          <ul>
            {frontMatter.contributors.split(",").map((s) => {
              const parts = s.trim().split(" ");
              const name = parts.slice(0, parts.length - 1).join(" ");
              const emojis = parts[parts.length - 1];
              return (
                <li key={s}>
                  {contributors[name] ? (
                    <>
                      <ExternalLink href={contributors[name]}>
                        {name}
                      </ExternalLink>
                    </>
                  ) : (
                    name
                  )}{" "}
                  {emojis
                    .split("")
                    .map((s, i) => `${s}${emojis.charAt(i + 1)}`)
                    .filter((_, i) => i % 2 === 0)
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

export default ExtensionPageLayout;
