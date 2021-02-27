import React from "react";
import StandardLayout from "./StandardLayout";
import GithubSponsor from "./GithubSponsor";
import { frontMatter as frontMatters } from "../pages/docs/extensions/*.mdx";
import { Body, CardGrid, H4 } from "@dvargas92495/ui";

const INDEX_LABEL = "Getting Started";

export const pathToId = (f: string): string =>
  f.substring("docs\\extensions\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string): string =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const items = frontMatters.map((f) => ({
  title: pathToLabel(f.__resourcePath)
    .split(" ")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" "),
  description: f.description,
  image: `/thumbnails/${pathToId(f.__resourcePath)}.png`,
  href: f.__resourcePath.replace(/\.mdx$/, ""),
  development: !!f.development,
}));
export const prodItems = items.filter((f) => !f.development);
const devItems = items.filter((f) => f.development);

const ExtensionLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children }) => {
  return (
    <StandardLayout>
      <div>{children}</div>
      <CardGrid items={prodItems} width={3} />
      <H4>Under Development</H4>
      <Body>
        The following extensions are still under development and are not yet
        ready for use!
      </Body>
      <CardGrid items={devItems} width={3} />
      <div style={{ margin: "16px 0" }}>
        <GithubSponsor />
      </div>
    </StandardLayout>
  );
};

export default ExtensionLayout;
