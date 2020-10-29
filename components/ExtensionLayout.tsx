import { VerticalNavigationTabs } from "@dvargas92495/ui";
import React from "react";
import Layout from "./Layout";
import GithubSponsor from "./GithubSponsor";
import { frontMatter as frontMatters } from "../pages/extensions/docs/*.mdx";

const INDEX_LABEL = "Getting Started";

export const pathToId = (f: string) =>
  f.substring("extensions\\docs\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string) =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const ExtensionLayout = ({
  children,
  frontMatter,
}: {
  children: React.ReactNode;
  frontMatter: FrontMatter;
}) => {
  const items = frontMatters
    .map((f) => f.__resourcePath)
    .map((f) => ({
      label: pathToLabel(f),
      href: `/${f.substring(0, f.length - ".mdx".length)}`,
    }));
  return (
    <Layout>
      <VerticalNavigationTabs
        items={[{ label: INDEX_LABEL, href: "/extensions" }, ...items]}
        label={pathToLabel(frontMatter.__resourcePath)}
      >
        {children}
        <GithubSponsor />
      </VerticalNavigationTabs>
    </Layout>
  );
};

export default ExtensionLayout;
