import React from "react";
import Layout from "../../components/Layout";
import { GetStaticProps } from "next";
import axios from "axios";
import { idToTitle } from "../../components/hooks";
import { useRouter } from "next/router";

type ExtensionMetadata = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

const ExtensionCard = (props: ExtensionMetadata) => {
  const router = useRouter();
  return (
    <div className="shadow-sm rounded-lg border border-gray-100 border-opacity-50 p-4 h-32 flex-1 flex flex-col bg-white relative">
      <div className="flex gap-4 flex-1 max-h-24">
        <div
          className={"h-24 w-24 flex-shrink-0 flex justify-center items-center"}
        >
          <img
            src={props.image}
            className={"rounded-lg border border-gray-100 border-opacity-50"}
          />
        </div>
        <div className="overflow-hidden overflow-ellipsis">
          <h2
            className="text-xl font-semibold mb-4 cursor-pointer"
            onClick={() => router.push(props.href)}
          >
            {props.title}
          </h2>
          <p className="text-xs mb-0 overflow-ellipsis">{props.description}</p>
        </div>
      </div>
    </div>
  );
};

const ExtensionHomePage = ({
  extensions,
}: {
  extensions: ExtensionMetadata[];
}): React.ReactElement => {
  return (
    <Layout
      title={"RoamJS Extensions"}
      description={
        "Upgrade your Roam Graph with these free to download extensions!"
      }
      activeLink={"extensions"}
    >
      <div className="flex flex-col w-full -mb-16">
        <h1 className="font-bold text-4xl my-8 text-center">
          Discover <span className="text-sky-400">RoamJS</span>{" "}
          <span className="text-orange-400">Extensions</span>
        </h1>
        <p className="mb-24 text-center font-semibold text-lg">
          We are the leading publisher of Roam Depot extensions. Check out our
          work below!
        </p>
        <div className="flex-grow w-full flex flex-col items-center pb-8">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mb-24 w-full max-w-6xl mx-auto gap-8">
            {extensions.map((e) => (
              <ExtensionCard {...e} key={e.id} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<{
  extensions: ExtensionMetadata[];
}> = () =>
  axios
    .get(`https://lambda.roamjs.com/request-path`)
    .then((r) => ({
      props: {
        extensions: r.data.paths
          .filter((p) => p.state !== "PRIVATE")
          .map(({ id, description }) => ({
            id,
            title: idToTitle(id),
            description: description || "Description for " + idToTitle(id),
            image: `https://roamjs.com/thumbnails/${id}.png`,
            href: `/extensions/${id}`,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)),
      },
    }))
    .catch(() => ({
      props: { extensions: [] },
    }));

export default ExtensionHomePage;
