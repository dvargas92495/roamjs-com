import { H1, H2, H3, H4, H5, H6, Body } from "@dvargas92495/ui";
import React from "react";
import Loom from "./Loom";
import YouTube from "./Youtube";
import { Prism } from "react-syntax-highlighter";

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

export const Center: React.FunctionComponent = ({ children }) => {
  return <div style={{ textAlign: "center" }}>{children}</div>;
};

const Highlight: React.FunctionComponent = ({ children }) => {
  return <span style={{ backgroundColor: "#ffff00" }}>{children}</span>;
};

const Block: React.FunctionComponent<{ id: string }> = ({ id, children }) => {
  return <div id={id}>{children}</div>;
};

export default {
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
  Center,
  Highlight,
  Block,
};
