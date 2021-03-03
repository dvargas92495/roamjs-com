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
} from "@dvargas92495/ui";
import React, { useCallback, useMemo, useState } from "react";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";
import Loom from "./Loom";
import { FrontMatter, pathToId, pathToLabel, prodItems } from "./ExtensionLayout";
import { getSingleCodeContent, useCopyCode } from "./hooks";
import StandardLayout from "./StandardLayout";
import GithubSponsor from "./GithubSponsor";

const total = prodItems.length;
const rowLength = 4;

const contributors = {
  "Rodrigo Franco": "https://www.rodrigofranco.com/",
  "David Chelimsky": "http://blog.davidchelimsky.net/",
  "Tomáš Baránek": "https://twitter.com/tombarys",
  "Abhay Prasanna": "https://twitter.com/AbhayPrasanna",
  "Brandon Toner": "https://brandontoner.substack.com/",
  "Conor White-Sullivan": "https://twitter.com/Conaw",
  "Matt Brockwell": "https://twitter.com/Jeanvaljean689",
  "Eddie Cohen": "https://eddiecohen.com/",
  "Rushi Bhavsar": "https://twitter.com/RushiBhavsar",
  "Chris Kunicki": "https://twitter.com/roamhacker",
  "Ivo Velitchkov": "https://www.strategicstructures.com/",
  "Mathew McGann": "http://www.mcgannfreestone.com.au/",
  "Bardia Pourvakil": "https://twitter.com/thepericulum",
  "Gene Kim": "https://twitter.com/RealGeneKim",
  "Tony Ennis": "https://tonyennis.com",
  "Sharon Dale": "http://www.sharondale.co.uk/",
  "Eric Anderson": "http://ecanderson.com/",
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
        .filter(a => a.title !== label)
        .map((a) => ({ sort: Math.random(), value: a }))
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
    <StandardLayout>
      <Breadcrumbs
        page={label}
        links={[
          {
            text: "HOME",
            href: "/docs",
          },
          {
            text: "EXTENSIONS",
            href: "/docs",
          },
        ]}
      />
      {frontMatter.development && <H2>UNDER DEVELOPMENT</H2>}
      <H1>{label}</H1>
      <Subtitle>
        {frontMatter.description} The name of the script is <code>{id}</code>.
      </Subtitle>
      <H3>Installation</H3>
      <Body>
        You could use the Copy Extension button below to individually install
        this extension. To install, just paste anywhere in your Roam graph and
        click "Yes, I Know What I'm Doing".
      </Body>
      <div style={{ marginBottom: 24 }}>
        <Button
          onClick={() => onSave([id])}
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
      <Prism language="javascript">{getSingleCodeContent(id)}</Prism>
      <H3>Usage</H3>
      {children}
      {!frontMatter.development && (
        <>
          <H3>Demo</H3>
          {frontMatter.loom ? (
            <Loom id={frontMatter.loom} />
          ) : (
            <DemoVideo src={pathToId(frontMatter.__resourcePath)} />
          )}
        </>
      )}
      {frontMatter.contributors && (
        <>
          <H3>Contributors</H3>
          <Body>
            A special thanks to those who's contributions helped make this
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
                      {` ${emojis}`}
                    </>
                  ) : (
                    s
                  )}
                </li>
              );
            })}
          </ul>
          <ExternalLink href={"https://allcontributors.org/docs/en/emoji-key"}>
            Emoji Key
          </ExternalLink>
        </>
      )}
      <div style={{ margin: "16px 0" }}>
        <GithubSponsor />
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
