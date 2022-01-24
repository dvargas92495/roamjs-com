import { H1, H2, H3, H4, H5, H6, Body, LI } from "@dvargas92495/ui";
import React from "react";
import Loom from "./Loom";
import YouTube from "./Youtube";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";

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

export const Center: React.FunctionComponent = ({ children, ...props }) => {
  return (
    <div style={{ textAlign: "center" }} {...props}>
      {children}
    </div>
  );
};

const Highlight: React.FunctionComponent = ({ children }) => {
  return <span style={{ backgroundColor: "#ffff00" }}>{children}</span>;
};

const Block: React.FunctionComponent<{ id: string }> = ({ id, children }) => {
  return <div id={id}>{children}</div>;
};

const Blockquote: React.FunctionComponent<{ id: string }> = ({ children }) => {
  return (
    <blockquote
      style={{
        backgroundColor: "#F5F8FA",
        borderLeft: "5px solid #30404D",
        fontSize: 14,
        margin: "0 0 10px",
        wordWrap: "break-word",
        padding: 4,
      }}
    >
      {children}
    </blockquote>
  );
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
  li: LI,
  Loom,
  YouTube,
  Center,
  Highlight,
  Block,
  DemoVideo,
  blockquote: Blockquote,
};
