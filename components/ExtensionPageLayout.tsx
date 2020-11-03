import { Body, H1, H2, H3, H4, Subtitle } from "@dvargas92495/ui";
import React, { useState } from "react";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";
import ExtensionLayout, { pathToId, pathToLabel } from "./ExtensionLayout";
import { useCopyCode } from "./hooks";

const ExtensionPageLayout = ({
  children,
  frontMatter,
}: {
  children: React.ReactNode;
  frontMatter: FrontMatter;
}) => {
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
        You could use the Copy Block button below to individually install this
        extension.
      </Body>
      <button style={{ marginBottom: 24 }} onClick={() => onSave([id])}>
        {copied ? "COPIED!" : "COPY EXTENSION"}
      </button>
      <H4>Manual Installation</H4>
      <Body>
        If instead you prefer to manually install, first create a <b>block</b>{" "}
        with the text <code>{"{{[[roam/js]]}}"}</code> on any page in your Roam
        DB. Then, copy and paste this code block as a child of the block.
      </Body>
      <Prism language="javascript">
        {`const old = document.getElementById("${id}");
if (old) {
  return;
}

const s = document.createElement("script");
s.src = "https://roamjs.com/${id}.js";
s.id = "${id}";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);`}
      </Prism>
      <H3>Usage</H3>
      {children}
      <H3>Demo</H3>
      <DemoVideo src={pathToId(frontMatter.__resourcePath)} />
    </ExtensionLayout>
  );
};

export default ExtensionPageLayout;
