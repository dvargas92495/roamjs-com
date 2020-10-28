import { VerticalNavigationTabs } from "@dvargas92495/ui";
import React, { useMemo } from "react";
import Layout from "./Layout";
import GithubSponsor from "./GithubSponsor";

const ExtensionLayout = ({ children }: { children: React.ReactNode }) => {
  /*const items = useMemo(() => {
    const fileNames = fs.readdirSync("docs/extensions");
    return fileNames.map((f) => f.replace(/\.md$/, "")).map(f => ({
      label: `${f.substring(0,1)}${f.replace(/-/g," ").substring(1)}`,
      href: f,
    }));
  }, []);*/
  return (
    <Layout>
      <VerticalNavigationTabs
        items={[
          { label: "Getting Started", href: "extensions" },
         // ...items,
        ]}
      >
        {children}
        <GithubSponsor />
      </VerticalNavigationTabs>
    </Layout>
  );
};

export default ExtensionLayout;
