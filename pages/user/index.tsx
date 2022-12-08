import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout";
import { ConfirmationDialog } from "@dvargas92495/ui";
import {
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPost,
} from "../../components/hooks";
import { SignedIn, UserProfile } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";
import Head from "next/head";
import ReactDOM from "react-dom";

type ClerkItem = { title: string; display: string; id: string };

const UserProfileTab = ({
  id,
  subtitle = `Manage ${id}`,
  cards = [],
  icon,
}: {
  id: string;
  subtitle?: string;
  icon?: React.ReactNode;
  cards?: {
    title: string;
    description: string;
    items?: ClerkItem[];
    Component?: React.FC;
    dialogTitle?: string;
    dialogContent?: string;
    getActions?: (
      i: ClerkItem,
      index: number
    ) => { text: string; onClick: () => Promise<unknown> }[] | (() => void);
  }[];
}) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.addEventListener("hashchange", (e) => {
      setActive(e.newURL.endsWith(`#/${id}`));
    });
    setActive(window.location.hash === `#/${id}`);
  }, [setMounted, id, setActive]);
  const title = `${id.slice(0, 1).toUpperCase()}${id.slice(1)}`;
  const ActionButton = ({
    onClick,
    ...i
  }: {
    onClick: () => void;
    title: string;
    display: string;
  }) => (
    <button
      className="cl-list-item tdcLsvPUy6va12fjbWeoaA== lDcSm5zthgXvDREoOppm+A== YQaXxv5CXpWrIgz9wCpq2g=="
      onClick={onClick}
    >
      <div className={"_9SNWFS-Vh0PZng3FdNfr4Q=="}>{i.title}</div>
      <div className={"+UDTovkDwHUg+nhZxGd0rQ== ydTkYqSHdXIQOM237Tl+rw=="}>
        <div className="xFJ5rpwkVmYhgKY1beHGww==">
          <div
            className="cl-list-item-entry "
            style={{ whiteSpace: "break-spaces" }}
          >
            {i.display}
          </div>
        </div>
        <div style={{ marginRight: "2.125em" }}>
          <svg
            width="1.25em"
            height="1.25em"
            viewBox="0 0 20 20"
            stroke="#335BF1"
            fill="none"
          >
            <path
              d="M3.333 10h13.332M11.666 5l5 5-5 5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </div>
      </div>
    </button>
  );
  return mounted ? (
    <>
      {ReactDOM.createPortal(
        <a
          className={`cl-navbar-link${active ? " cl-active" : ""}`}
          href={`${window.location.origin}/user#/${id}`}
        >
          {icon}
          {title}
        </a>,
        document.querySelector("nav.cl-navbar") || document.body
      )}
      {active &&
        ReactDOM.createPortal(
          <>
            <div className="cl-page-heading">
              <div className="cl-text-container">
                <h2 className="cl-title">{title}</h2>
                <p className="cl-subtitle">{subtitle}</p>
              </div>
            </div>
            {cards.map((c) => (
              <div
                className="TbneNCA4gZ19UdBjC4aa8w== UWBWNVaoq8lQMz06Xu2Cxg== cl-themed-card"
                key={c.title}
              >
                <div className="Em1H2funtme6EXt9AM65sQ==">
                  <h1 className="lxRDeMOoyAxXuzbXfY3AZA==">{c.title}</h1>
                  <p
                    className="lqA9GnSF-T6v3YCbt8CChA=="
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {c.description}
                  </p>
                </div>
                {c.items && (
                  <div className="cl-titled-card-list">
                    {c.items.map((i, index) => {
                      const action = c.getActions && c.getActions(i, index);
                      return typeof action === "function" ? (
                        <ActionButton key={i.id} onClick={action} {...i} />
                      ) : (
                        <ConfirmationDialog
                          key={i.id}
                          title={c.dialogTitle || ""}
                          content={c.dialogContent || ""}
                          actions={action}
                          Button={({ onClick }) => (
                            <ActionButton key={i.id} onClick={onClick} {...i} />
                          )}
                        />
                      );
                    })}
                  </div>
                )}
                {c.Component && (
                  <div style={{ paddingTop: 24 }}>
                    <c.Component />
                  </div>
                )}
              </div>
            ))}
          </>,
          document.querySelector("div.cl-main") || document.body
        )}
    </>
  ) : (
    <div />
  );
};

const ExtensionsTab = () => {
  const axiosGet = useAuthenticatedAxiosGet();
  const axiosPost = useAuthenticatedAxiosPost();
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenValue, setTokenValue] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedRef = useRef(0);
  useEffect(() => {
    axiosGet("token")
      .then((r) => setTokenValue(r.data.token))
      .finally(() => setTokenLoading(false));
    return () => window.clearTimeout(copiedRef.current);
  }, [setTokenValue, setTokenLoading]);
  return (
    <UserProfileTab
      id={"Extensions"}
      icon={
        <svg
          width="1.25em"
          height="1.25em"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          className="cl-icon"
        >
          <path
            d="M19 5h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v2H9V3c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v2H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM8.71 15.29a1.003 1.003 0 01-1.42 1.42l-4-4C3.11 12.53 3 12.28 3 12s.11-.53.29-.71l4-4a1.003 1.003 0 011.42 1.42L5.41 12l3.3 3.29zm8-2.58l-4 4a1.003 1.003 0 01-1.42-1.42l3.3-3.29-3.29-3.29A.965.965 0 0111 8a1.003 1.003 0 011.71-.71l4 4c.18.18.29.43.29.71s-.11.53-.29.71z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      }
      cards={[
        {
          title: "Token",
          description:
            "Your RoamJS user token gives you access to all of RoamJS' premium extensions.",
          getActions: () => [
            {
              text: "Copy",
              onClick: () => {
                setCopied(true);
                window.navigator.clipboard.writeText(tokenValue);
                copiedRef.current = window.setTimeout(
                  () => setCopied(false),
                  3000
                );
                return Promise.resolve();
              },
            },
            {
              text: "Generate New",
              onClick: () => {
                setTokenLoading(true);
                return axiosPost("token")
                  .then((r) => setTokenValue(r.data.token))
                  .finally(() => setTokenLoading(false));
              },
            },
          ],
          items: [
            {
              id: "0",
              title: "Token",
              display: tokenLoading
                ? "Loading..."
                : `${tokenValue
                    .split("")
                    .map(() => "∗")
                    .join("")}${copied ? "    Copied!" : ""}`,
            },
          ],
          dialogTitle: "Token Actions",
          dialogContent: "What would you like to do with your token",
        },
      ]}
    />
  );
};

const UserPage = (): JSX.Element => {
  return (
    <Layout
      title={"User | RoamJS"}
      description={"Manage your user settings for RoamJS"}
    >
      <SignedIn>
        {/*<Profile />*/}
        <Head>
          <style>{`div.cl-component.cl-user-profile .cl-main+.cl-powered-by-clerk {
  position: absolute;
}

div.cl-component.cl-user-profile {
  background-color: unset;
  height: fit-content !important;
  position: relative;
}

div.cl-component.cl-user-profile div.cl-main {
  margin-left: 24px;
  margin-right: 24px;
}

main>div.roamjs-standard-layout{
  width: unset;
  max-width: unset;
}`}</style>
        </Head>
        <UserProfile />
        <ExtensionsTab />
      </SignedIn>
      <RedirectToLogin />
    </Layout>
  );
};

export default UserPage;
