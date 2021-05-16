import { H1, H2, H3, H4, H5, H6, Body } from "@dvargas92495/ui";
import React, { useEffect, useState } from "react";
import Loom from "./Loom";
import YouTube from "./Youtube";
import { Prism } from "react-syntax-highlighter";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";

const Pre: React.FunctionComponent<HTMLPreElement> = ({ children }) => (
  <>{children}</>
);

const Code: React.FunctionComponent<HTMLElement> = ({
  className,
  children,
}) => {
  return (
    <Prism language={(className || "").substring("language-".length)}>
      {typeof children === "string" ? children.trim() : children}
    </Prism>
  );
};

const InlineCode: React.FunctionComponent = ({ children }) => (
  <code
    style={{ backgroundColor: "#33333320", borderRadius: 4, padding: "0 4px" }}
  >
    {children}
  </code>
);

const MdxImage = (
  props: React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >
): React.ReactElement => (
  <img
    {...props}
    style={{
      maxWidth: 480,
      boxShadow: "0px 3px 14px #00000040",
      borderRadius: 8,
      margin: "64px auto",
      display: "block",
    }}
  />
);

const inlineComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Body,
  code: Code,
  inlineCode: InlineCode,
  pre: Pre,
  img: MdxImage,
  Loom,
  YouTube,
};

const Center: React.FunctionComponent = ({ children }) => {
  const [contents, setContents] = useState({
    compiledSource: children as string,
  });
  useEffect(() => {
    serialize(children as string).then(setContents);
  }, [setContents]);
  return (
    <div style={{ textAlign: "center" }}>
      <MDXRemote
        compiledSource={contents.compiledSource}
        components={inlineComponents}
      />
    </div>
  );
};

export default {
  ...inlineComponents,
  Center,
};
