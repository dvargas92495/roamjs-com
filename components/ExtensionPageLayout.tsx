import { Body, H2, H3, Subtitle } from "@dvargas92495/ui";
import React from "react";
import { Prism } from "react-syntax-highlighter";
import ExtensionLayout, { pathToId, pathToLabel } from "./ExtensionLayout";

const pathToVideo = (f: string) => `/videos/${pathToId(f)}.mp4`;

const ExtensionPageLayout = ({
  children,
  frontMatter,
}: {
  children: React.ReactNode;
  frontMatter: FrontMatter;
}) => {
  const id = pathToId(frontMatter.__resourcePath);
  return (
    <ExtensionLayout frontMatter={frontMatter}>
      <H2>{pathToLabel(frontMatter.__resourcePath).toUpperCase()}</H2>
      <Subtitle>
        {frontMatter.description} The name of the script is <code>{id}</code>.
      </Subtitle>
      <H3>Installation</H3>
      <Body>
        Insert this as a child of any <code>{"{{[[roam/js]]}}"}</code> block to
        install the extension.
      </Body>
      <Prism language="javascript">
        {`var old = document.getElementById("${id}");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/${id}.js";
s.id = "${id}";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);`}
      </Prism>
      <H3>Usage</H3>
      {children}
      <H3>Demo</H3>
      <video
        width="320"
        height="240"
        controls
        src={pathToVideo(frontMatter.__resourcePath)}
        style={{ display: "block" }}
      />
    </ExtensionLayout>
  );
};

export default ExtensionPageLayout;
