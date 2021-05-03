import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { Body, CardGrid, H1, H4 } from "@dvargas92495/ui";
import { items } from "../../components/ExtensionPageLayout";
import { defaultLayoutProps } from "../../components/Layout";

const prodItems = items.filter((f) => !f.development);
const devItems = items.filter((f) => f.development);

const ExtensionHomePage = (): React.ReactElement => {
  return (
    <StandardLayout
      title={"RoamJS Extensions"}
      description={
        "Upgrade your Roam Graph with these free to download extensions!"
      }
      img={defaultLayoutProps.img}
    >
      <H1>Home</H1>
      <Body>
        Welcome to RoamJS Extensions! Click on any of the extensions below to
        find out more about how to install and use them.
      </Body>
      <CardGrid items={prodItems} width={3} />
      <H4>Under Development</H4>
      <Body>
        The following extensions are still under development and are not yet
        ready for use!
      </Body>
      <CardGrid items={devItems} width={3} />
    </StandardLayout>
  );
};

export default ExtensionHomePage;
