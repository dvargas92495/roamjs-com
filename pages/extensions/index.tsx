import React, { useState } from "react";
import Layout from "../../components/Layout";
import { GetStaticProps } from "next";
import axios from "axios";
import { API_URL } from "../../components/constants";
import { idToTitle, useCopyCode } from "../../components/hooks";
import { useRouter } from "next/router";
import Toast from "@dvargas92495/app/components/Toast";

type ExtensionMetadata = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  state: "LIVE" | "DEVELOPMENT" | "PRIVATE" | "LEGACY" | "UNDER REVIEW";
  featured: number;
  user: { name: string; email: string };
  entry: string;
};

const ExtensionCard = (props: ExtensionMetadata) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const onSave = useCopyCode(setCopied, "", true);
  const mainEntry = props.state === "LEGACY" ? props.id : `${props.id}/main`;
  return (
    <div className="shadow-sm rounded-lg border border-gray-100 border-opacity-50 p-4 h-48 flex-1 flex flex-col bg-white relative">
      {(props.state === "DEVELOPMENT" || props.state === "UNDER REVIEW") && (
        <div className="absolute top-0 flex justify-center w-full">
          <div className="relative -top-4 rounded-lg bg-slate-700 text-white px-3 py-1">
            🚧 WIP
          </div>
        </div>
      )}
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
      <hr className="my-4" />
      <div className="flex justify-between items-center">
        <div>Made By {props.user.name}</div>
        {props.state === "LEGACY" && (
          <button
            className="bg-sky-500 text-white py-2 px-4 rounded-md"
            onClick={() => onSave(mainEntry, props.entry)}
          >
            Copy
          </button>
        )}
        {props.state === "DEVELOPMENT" && (
          <a
            className="bg-sky-500 text-white py-2 px-4 rounded-md"
            href={`/downloads/${props.id}.zip`}
            download
          >
            Download
          </a>
        )}
        {props.state === "LIVE" && <span>Available in Roam Depot</span>}
        <Toast
          isOpen={copied}
          onClose={() => setCopied(false)}
          message={"Copied Extension! Paste into your Roam graph to install!"}
          autoHideDuration={10000}
        />
      </div>
    </div>
  );
};

const FEATURED_LENGTH = 3;

const SearchSvg = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.5 14.0003H14.71L14.43 13.7303C15.63 12.3303 16.25 10.4203 15.91 8.39026C15.44 5.61026 13.12 3.39026 10.32 3.05026C6.09002 2.53026 2.53002 6.09026 3.05002 10.3203C3.39002 13.1203 5.61002 15.4403 8.39002 15.9103C10.42 16.2503 12.33 15.6303 13.73 14.4303L14 14.7103V15.5003L18.25 19.7503C18.66 20.1603 19.33 20.1603 19.74 19.7503C20.15 19.3403 20.15 18.6703 19.74 18.2603L15.5 14.0003ZM9.50002 14.0003C7.01002 14.0003 5.00002 11.9903 5.00002 9.50026C5.00002 7.01026 7.01002 5.00026 9.50002 5.00026C11.99 5.00026 14 7.01026 14 9.50026C14 11.9903 11.99 14.0003 9.50002 14.0003Z"
      fill="#2E364D"
    />
  </svg>
);

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
  const [search, setSearch] = useState("");
  const searchRegex = new RegExp(search, "i");
  const filteredExtensions = extensions.filter(
    (e) =>
      !search ||
      searchRegex.test(e.title) ||
      searchRegex.test(e.description) ||
      searchRegex.test(e.user.name)
  );
  const [max, setMax] = useState(9);
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
        <div className="bg-gray-100 flex-grow w-full flex flex-col items-center pb-8">
          <h2 className="text-3xl font-bold text-center mb-12 mt-24">
            All Extensions
          </h2>
          <div className="border border-black rounded-lg p-2 bg-white max-w-2xl w-full mb-24 flex items-center h-12">
            <span className="mag h-8 w-8 inline-flex justify-center items-center">
              <SearchSvg />
            </span>
            <input
              placeholder="Search Extension by name, description author..."
              className="focus:ring-0 active:ring-0 flex-grow h-full focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-3 grid-cols-1 mb-24 w-full max-w-6xl mx-auto gap-8">
            {filteredExtensions.slice(0, max).map((e) => (
              <ExtensionCard {...e} key={e.id} />
            ))}
          </div>
          {max < filteredExtensions.length && (
            <div className={"flex justify-center"}>
              <button
                onClick={() => setMax(max + 9)}
                className={`px-6 py-3 font-semibold rounded-full bg-sky-500 shadow-sm hover:bg-sky-700 active:bg-sky-900 hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:bg-opacity-50 disabled:opacity-50 disabled:hover:bg-sky-500 disabled:hover:shadow-none disabled:active:bg-sky-500 disabled:hover:bg-opacity-50`}
              >
                Show More
              </button>
            </div>
          )}
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
          .map(({ id, description, state, featured, user }) => ({
            id,
            title: idToTitle(id),
            description: description || "Description for " + idToTitle(id),
            image: `https://roamjs.com/thumbnails/${id}.png`,
            href: `/extensions/${id}`,
            state: state === "UNDER REVIEW" ? "DEVELOPMENT" : state,
            featured,
            user,
          }))
          .sort((a, b) =>
            a.state === b.state
              ? a.title.localeCompare(b.title)
              : b.state.localeCompare(a.state)
          ),
      },
    }))
    .catch(() => ({
      props: { extensions: [] },
    }));

export default ExtensionHomePage;
