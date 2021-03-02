import { H1, H2, H4, H6, Items, Tooltip } from "@dvargas92495/ui";
import React from "react";
import Link from "next/link";
import StandardLayout from "./StandardLayout";
import { frontMatter as frontMatters } from "../pages/services/*.mdx";
import { FrontMatter } from "./ExtensionLayout";

const INDEX_LABEL = "Overview";

export const pathToId = (f: string): string =>
  f.substring("services\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string): string =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const Title = React.forwardRef<
  HTMLHeadingElement,
  { title: string; href: string }
>(({ title, href, ...props }, ref) => (
  <Link href={href}>
    <H6
      style={{
        margin: 0,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      ref={ref}
      {...props}
    >
      {title}
    </H6>
  </Link>
));

const ServiceLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children, frontMatter }) => {
  const items = frontMatters
    .filter((f) => !f.__resourcePath.endsWith("index.mdx"))
    .map((f) => {
      const title = pathToLabel(f.__resourcePath)
        .split(" ")
        .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
        .join(" ");
      const href = `/${f.__resourcePath.replace(/\.mdx$/, "")}`;
      return {
        primary: (
          <Tooltip title={title}>
            <span>
              <Title title={title} href={href} />
            </span>
          </Tooltip>
        ),
        avatar: (
          <>
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                height: "100%",
              }}
            />
            <img
              src={`/thumbnails/${pathToId(f.__resourcePath)}.png`}
              width={32}
              height={32}
              style={{ verticalAlign: "middle" }}
            />
          </>
        ),
        action: <H6 color={"primary"}>${f.price}</H6>,
        key: pathToId(f.__resourcePath),
      };
    });
  return (
    <StandardLayout>
      {frontMatter.development && <H2>UNDER DEVELOPMENT</H2>}
      <H1>{pathToLabel(frontMatter.__resourcePath).toUpperCase()}</H1>
      {children}
      <H4 style={{ textAlign: "center" }}>All Services</H4>
      <Items
        items={items}
        listClassName={"roamjs-services-list"}
        itemClassName={"roamjs-services-item"}
      />
    </StandardLayout>
  );
};

export default ServiceLayout;
