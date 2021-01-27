import { H1, H2, VerticalNavigationTabs } from "@dvargas92495/ui";
import React from "react";
import Layout from "./Layout";
import { frontMatter as frontMatters } from "../pages/services/*.mdx";

const INDEX_LABEL = "Overview";

export const pathToId = (f: string): string =>
  f.substring("services\\".length, f.length - ".mdx".length);

export const pathToLabel = (f: string): string =>
  f.endsWith("index.mdx") ? INDEX_LABEL : pathToId(f).replace(/-/g, " ");

const ServiceLayout: React.FunctionComponent<{
  frontMatter: FrontMatter;
}> = ({ children, frontMatter }) => {
  const items = frontMatters
    .map((f) => f.__resourcePath)
    .filter(f => !f.endsWith('index.mdx'))
    .map((f) => ({
      label: pathToLabel(f),
      href: f.substring(0, f.length - ".mdx".length),
    }));
  return (
    <Layout>
      <VerticalNavigationTabs
        items={[{ label: INDEX_LABEL, href: "services" }, ...items]}
        label={pathToLabel(frontMatter.__resourcePath)}
        title={"ROAMJS SERVICES"}
      >
        {frontMatter.development && <H2>UNDER DEVELOPMENT</H2>}
        <H1>{pathToLabel(frontMatter.__resourcePath).toUpperCase()}</H1>
        {children}
      </VerticalNavigationTabs>
    </Layout>
  );
};

export default ServiceLayout;
