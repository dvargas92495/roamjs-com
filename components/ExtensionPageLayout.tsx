import {
  Body,
  Button,
  ExternalLink,
  H1,
  H2,
  H3,
  H4,
  Subtitle,
} from "@dvargas92495/ui";
import React, { useState } from "react";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";
import ExtensionLayout, { pathToId, pathToLabel } from "./ExtensionLayout";
import { getSingleCodeContent, useCopyCode } from "./hooks";

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
};

const ExtensionPageLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children, frontMatter }) => {
  const id = pathToId(frontMatter.__resourcePath);
  const [copied, setCopied] = useState(false);
  const onSave = useCopyCode(setCopied);
  return (
    <ExtensionLayout frontMatter={frontMatter}>
      {frontMatter.development && <H2>UNDER DEVELOPMENT</H2>}
      <H1>{pathToLabel(frontMatter.__resourcePath).toUpperCase()}</H1>
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
      <H3>Demo</H3>
      <DemoVideo src={pathToId(frontMatter.__resourcePath)} />
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
    </ExtensionLayout>
  );
};

export default ExtensionPageLayout;
