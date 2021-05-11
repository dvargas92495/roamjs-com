import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { Body, CardGrid, H1, H4 } from "@dvargas92495/ui";
import { items } from "../../components/ExtensionPageLayout";
import { defaultLayoutProps } from "../../components/Layout";
import { GetStaticProps } from "next";
import axios from "axios";
import { API_URL } from "../../components/constants";
import { idToTitle } from "../../components/hooks";

type ExtensionMetadata = {
  title: string;
  description: string;
  image: string;
  href: string;
  development: boolean;
};
const prodItems = items.filter((f) => !f.development);
const devItems = items.filter((f) => f.development);

const ExtensionHomePage = ({
  extensions,
}: {
  extensions: ExtensionMetadata[];
}): React.ReactElement => {
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
      <CardGrid
        items={[
          ...prodItems,
          ...extensions.filter(({ development }) => !development),
        ].sort(({ title: a }, { title: b }) => a.localeCompare(b))}
        width={3}
      />
      <H4>Under Development</H4>
      <Body>
        The following extensions are still under development and are not yet
        ready for use!
      </Body>
      <CardGrid
        items={[
          ...devItems,
          ...extensions.filter(({ development }) => development),
        ]}
        width={3}
      />
    </StandardLayout>
  );
};

export const getStaticProps: GetStaticProps<{
  extensions: ExtensionMetadata[];
}> = () =>
  axios
    .get(`${API_URL}/request-path`)
    .then((r) => ({
      props: {
        extensions: r.data.paths.map(({ id, description, state }) => ({
          title: idToTitle(id),
          description: description || "Description for " + idToTitle(id),
          image: `/thumbnails/${id}.png`,
          href: `/extensions/${id}`,
          development: !state || state === "DEVELOPMENT",
        })),
      },
    }))
    .catch(() => ({
      props: { extensions: [] },
    }));

export default ExtensionHomePage;
