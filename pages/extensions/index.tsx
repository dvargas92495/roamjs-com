import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { Body, H1, H4 } from "@dvargas92495/ui";
import { defaultLayoutProps } from "../../components/Layout";
import { GetStaticProps } from "next";
import axios from "axios";
import { API_URL } from "../../components/constants";
import { idToTitle } from "../../components/hooks";
import CardGrid from "../../components/CardGrid";

type ExtensionMetadata = {
  title: string;
  description: string;
  image: string;
  href: string;
  state: "LIVE" | "DEVELOPMENT" | "PRIVATE" | "LEGACY";
};

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
      <H1>Extensions</H1>
      <Body style={{marginBottom: 32}}>
        Welcome to RoamJS Extensions! Click on any of the extensions below to
        find out more about how to install and use them.
      </Body>
      <CardGrid
        items={extensions
          .filter(({ state }) => state === "LIVE" || state === "LEGACY")
          .sort(({ title: a }, { title: b }) => a.localeCompare(b))}
        width={2}
      />
      <H4>Under Development</H4>
      <Body>
        The following extensions are still under development and are not yet
        ready for use!
      </Body>
      <CardGrid
        items={extensions
          .filter(({ state }) => state === "DEVELOPMENT")
          .sort(({ title: a }, { title: b }) => a.localeCompare(b))}
        width={2}
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
        extensions: r.data.paths
          .filter((p) => p.state !== "PRIVATE")
          .map(({ id, description, state }) => ({
            title: idToTitle(id),
            description: description || "Description for " + idToTitle(id),
            image: `https://roamjs.com/thumbnails/${id}.png`,
            href: `/extensions/${id}`,
            state,
          })),
      },
    }))
    .catch(() => ({
      props: { extensions: [] },
    }));

export default ExtensionHomePage;
