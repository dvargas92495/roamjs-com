import React, { useState } from "react";
import Layout from "../../components/Layout";
import { GetStaticProps } from "next";
import axios from "axios";
import { API_URL } from "../../components/constants";
import { idToTitle } from "../../components/hooks";

type ExtensionMetadata = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  state: "LIVE" | "DEVELOPMENT" | "PRIVATE" | "LEGACY" | "UNDER REVIEW";
  featured: number;
};

const ExtensionCard = (props: ExtensionMetadata) => {
  return (
    <div className="shadow-sm rounded-lg border border-gray-100 border-opacity-50 p-4 h-48 flex-1 flex flex-col bg-white">
      <div className="flex gap-4 flex-1 max-h-24">
        <img
          src={props.image}
          className={
            "rounded-lg border border-gray-100 border-opacity-50 h-24 w-24"
          }
        />
        <div className="overflow-hidden overflow-ellipsis">
          <h2 className="text-xl font-semibold mb-4">{props.title}</h2>
          <p className="text-sm mb-0 overflow-ellipsis">{props.description}</p>
        </div>
      </div>
      <hr className="my-4" />
      <div className="flex justify-between items-center">
        <div>Made By RoamJS</div>
        <button className="bg-sky-500 text-white py-2 px-4 rounded-md">
          Copy
        </button>
      </div>
    </div>
  );
};

const FEATURED_LENGTH = 3;

const ExtensionHomePage = ({
  extensions,
}: {
  extensions: ExtensionMetadata[];
}): React.ReactElement => {
  const featured = extensions
    .filter((e) => e.featured > 0)
    .sort((a, b) => a.featured - b.featured);
  const [page, setPage] = useState(0);
  const featuredStart = (page * FEATURED_LENGTH) % featured.length;
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
          Click on any of the extensions below to find out how to use them.
        </p>
        <h2 className="text-3xl font-bold text-center mb-12">
          Featured Extensions
        </h2>
        <div className="flex items-center gap-8 mb-16 max-w-6xl mx-auto w-full">
          <div
            className="h-0 w-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-black cursor-pointer"
            onClick={() => setPage(page - 1)}
          />
          {featured
            .slice(featuredStart)
            .concat(featured.slice(0, featuredStart))
            .slice(0, FEATURED_LENGTH)
            .map((props) => (
              <ExtensionCard {...props} key={props.id} />
            ))}
          <div
            className="h-0 w-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-black cursor-pointer"
            onClick={() => setPage(page + 1)}
          />
        </div>
        <hr className="bg-black" />
        <div className="bg-gray-100 flex-grow w-full flex flex-col items-center">
          <h2 className="text-3xl font-bold text-center mb-12 mt-24">
            All Extensions
          </h2>
          <div className="border border-black rounded-lg p-2 bg-white max-w-2xl w-full mb-24 flex items-center h-12">
            <span className="mag h-8 w-8 inline-block" />
            <input
              placeholder="Search Extension by name, description, author..."
              className="focus:ring-0 active:ring-0 flex-grow h-full focus:outline-none"
            />
            <span className="cmd+k rounded-lg shadow-sm border border-gray-500 border-opacity-50 w-12 h-8 inline-block" />
          </div>
          <div className="grid grid-cols-3 mb-24 w-full max-w-6xl mx-auto gap-8">
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
    .get(`${API_URL}/request-path`)
    .then((r) => ({
      props: {
        extensions: r.data.paths
          .filter((p) => p.state !== "PRIVATE")
          .map(({ id, description, state, featured }) => ({
            id,
            title: idToTitle(id),
            description: description || "Description for " + idToTitle(id),
            image: `https://roamjs.com/thumbnails/${id}.png`,
            href: `/extensions/${id}`,
            state,
            featured,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)),
      },
    }))
    .catch(() => ({
      props: { extensions: [] },
    }));

export default ExtensionHomePage;
