import { VerticalNavigationTabs } from "@dvargas92495/ui";
import React from "react";
import Layout from "./Layout";
import GithubSponsor from "./GithubSponsor";
import { frontMatter as frontMatters } from "../pages/docs/extensions/*.mdx";

const INDEX_LABEL = "Getting Started";

export const pathToId = (f: string): string =>
  f.substring("docs\\extensions\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string): string =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const ExtensionLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children, frontMatter }) => {
  const items = frontMatters
    .map((f) => f.__resourcePath)
    .map((f) => ({
      label: pathToLabel(f),
      href: f.substring(0, f.length - ".mdx".length),
    }));
  return (
    <Layout>
      <VerticalNavigationTabs
        items={[{ label: INDEX_LABEL, href: "docs" }, ...items]}
        label={pathToLabel(frontMatter.__resourcePath)}
        title={"ROAMJS DOCS"}
      >
        <div>{children}</div>
        <div style={{margin: '16px 0'}}>
          <GithubSponsor />
        </div>
      </VerticalNavigationTabs>
    </Layout>
  );
};

export default ExtensionLayout;
