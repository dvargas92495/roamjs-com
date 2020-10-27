import { VerticalNavigationTabs } from "@dvargas92495/ui";
import React from "react";
import Layout from "./Layout";
import GithubSponsor from "./GithubSponsor";

const ExtensionLayout = ({ children }: { children: React.ReactNode }) => (
  <Layout>
    <VerticalNavigationTabs
      items={[
        { label: "Getting Started", href: "extensions" },
        { label: "Attr tables", href: "extensions/attr-table" },
        { label: "Emoji", href: "extensions/emoji" },
        { label: "Github", href: "extensions/github" },
      ]}
    >
      {children}
      <GithubSponsor />
    </VerticalNavigationTabs>
  </Layout>
);

export default ExtensionLayout;
