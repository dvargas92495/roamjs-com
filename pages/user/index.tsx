import React, { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout";
import { Button, Loading, ConfirmationDialog } from "@dvargas92495/ui";
import {
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPut,
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosDelete,
} from "../../components/hooks";
import { SignedIn, UserProfile } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";
import { getStripe } from "../../components/constants";
import Head from "next/head";
import ReactDOM from "react-dom";
import format from "date-fns/format";

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

type PaymentMethod = {
  brand: string;
  last4: string;
  id: string;
};

type Subscription = {
  name: string;
  description: string;
  id: string;
  amount: number;
  date: number;
};

type Invoice = {
  name: string;
  date: string;
  id: string;
  total: number;
  pdf: string;
};

const AddCard = () => {
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [loading, setLoading] = useState(false);
  const addCard = useCallback(() => {
    setLoading(true);
    authenticatedAxiosPost("payment-methods")
      .then(
        (r) =>
          r.data.id &&
          getStripe()
            .then(
              (s) =>
                s &&
                s.redirectToCheckout({
                  sessionId: r.data.id,
                })
            )
            .then(() => Promise.resolve())
      )
      .catch(() => {
        setLoading(false);
      });
  }, [authenticatedAxiosPost]);
  return (
    <>
      <Button
        color={"primary"}
        variant={"contained"}
        onClick={addCard}
        disabled={loading}
        style={{ marginRight: 16 }}
      >
        Add Card
      </Button>
      <Loading loading={loading} />
    </>
  );
};

const ExtensionsTab = () => {
  const axiosGet = useAuthenticatedAxiosGet();
  const axiosPost = useAuthenticatedAxiosPost();
  const axiosDelete = useAuthenticatedAxiosDelete();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenValue, setTokenValue] = useState("");
  const [copied, setCopied] = useState(false);
  const subscribe = useCallback(() => {
    setLoading(true);
    return axiosPost("convertkit")
      .then(() => {
        setIsSubscribed(true);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setIsSubscribed, axiosPost]);
  const unsubscribe = useCallback(() => {
    setLoading(true);
    return axiosDelete("convertkit")
      .then(() => {
        setIsSubscribed(false);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setIsSubscribed, axiosDelete]);
  const copiedRef = useRef(0);
  useEffect(() => {
    axiosGet("convertkit")
      .then((r) => setIsSubscribed(r.data.isSubscribed))
      .finally(() => setLoading(false));
    axiosGet("token")
      .then((r) => setTokenValue(r.data.token))
      .finally(() => setTokenLoading(false));
    return () => window.clearTimeout(copiedRef.current);
  }, [setLoading, setTokenValue, setTokenLoading]);
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
          title: "Digest",
          description:
            "Subscribe or unsubscribe from the RoamJS Digest, an email detailing RoamJS' latest updates.",
          items: [
            {
              title: "Status",
              id: "0",
              display: loading
                ? "Loading..."
                : isSubscribed
                ? "Subscribed"
                : "Unsubscribed",
            },
          ],
          dialogTitle: "RoamJS Digest",
          dialogContent: `Would you like to ${
            isSubscribed ? "un" : ""
          }subscribe to the RoamJS Digest?`,
          getActions: () => [
            isSubscribed
              ? { text: "Unsubscribe", onClick: unsubscribe }
              : { text: "Subscribe", onClick: subscribe },
          ],
        },
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

const BillingTab = () => {
  const [payment, setPayment] = useState<PaymentMethod>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  const authenticatedAxiosDel = useAuthenticatedAxiosDelete();
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [error, setError] = useState("");
  const getPayment = useCallback(
    () =>
      authenticatedAxios("payment-methods")
        .then((r) => {
          setPayment(r.data.defaultPaymentMethod);
          setPaymentMethods(r.data.paymentMethods);
        })
        .catch((r) => setError(r.response?.data)),
    [authenticatedAxios, setPayment, setPaymentMethods, setError]
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const getSubscriptions = useCallback(
    () =>
      authenticatedAxios("subscriptions").then((r) =>
        setSubscriptions(r.data.subscriptions)
      ),
    [setSubscriptions]
  );
  const unsubscribe = useCallback(
    (id) =>
      authenticatedAxiosPost("end-service", { id }).then(() =>
        setSubscriptions(subscriptions.filter((s) => s.id !== id))
      ),
    [authenticatedAxiosPost, subscriptions, setSubscriptions]
  );
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoiceMaxPage, setInvoiceMaxPage] = useState(0);
  const [invoiceHasMore, setInvoiceHasMore] = useState(false);
  const [invoiceParams, setInvoiceParams] = useState({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const getInvoices = useCallback(() => {
    setInvoiceLoading(true);
    authenticatedAxios(
      `invoices${
        Object.entries(invoiceParams).length
          ? `?${new URLSearchParams(invoiceParams).toString()}`
          : ""
      }`
    ).then((r) => {
      setInvoices(r.data.invoices);
      setInvoiceHasMore(r.data.hasMore);
      setInvoiceLoading(false);
    });
  }, [
    invoiceParams,
    setInvoices,
    authenticatedAxios,
    setInvoiceHasMore,
    setInvoiceLoading,
  ]);
  const print = useCallback(
    (id: string) =>
      window.open(invoices.find((i) => i.id === id)?.pdf, "_blank")?.focus(),
    [invoices]
  );
  useEffect(() => {
    getPayment();
    getSubscriptions();
  }, [getPayment, getSubscriptions]);
  useEffect(() => {
    getInvoices();
  }, [getInvoices]);
  return (
    <UserProfileTab
      id={"billing"}
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
            d="M14.99 2.95h-14c-.55 0-1 .45-1 1v1h16v-1c0-.55-.45-1-1-1zm-15 10c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-6h-16v6zm5.5-2h5c.28 0 .5.22.5.5s-.22.5-.5.5h-5c-.28 0-.5-.22-.5-.5s.23-.5.5-.5zm-3 0h1c.28 0 .5.22.5.5s-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5s.23-.5.5-.5z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      }
      cards={[
        {
          title: "Card",
          description: `Default card used to pay for subscribed extensions${
            error && `\nERROR: ${error}`
          }`,
          items: paymentMethods
            .sort((a, b) =>
              a.id === payment?.id
                ? -1
                : b.id === payment?.id
                ? 1
                : a.id.localeCompare(b.id)
            )
            .map((pm, i) => ({
              title: pm.brand.toUpperCase(),
              id: pm.id,
              display: `Ends in ${pm.last4}${i === 0 ? " (default)" : ""}`,
            })),
          Component: AddCard,
          getActions: (i, index) => [
            {
              text: "Remove Card",
              onClick: () =>
                authenticatedAxiosDel(
                  `payment-methods?payment_method_id=${i.id}`
                ).then(() =>
                  setPaymentMethods(paymentMethods.filter((p) => p.id !== i.id))
                ),
            },
            ...(index === 0
              ? []
              : [
                  {
                    text: "Make Default",
                    onClick: () =>
                      authenticatedAxiosPut("payment-methods", {
                        id: i.id,
                      }).then(() =>
                        setPayment(paymentMethods.find((p) => p.id === i.id))
                      ),
                  },
                ]),
          ],
          dialogTitle: "Card Actions",
          dialogContent: "What would you like to do with this card?",
        },
        {
          title: "Subscriptions",
          description: `All of the extensions you are subscribed to, with the amount due by the end of your billing cycle. ${
            subscriptions.length
              ? `(${format(new Date(subscriptions[0].date), "MM/dd/yyyy")})`
              : ""
          }`,
          getActions: (i) => [
            { text: "Unsubscribe", onClick: () => unsubscribe(i.id) },
          ],
          items: subscriptions.map((s) => ({
            id: s.id,
            title: s.name,
            display: `$${s.amount}`,
          })),
          dialogTitle: "Subscription Actions",
          dialogContent: "What would you like to do with this subscription?",
          Component: () => (
            <b>Total: ${subscriptions.reduce((p, c) => p + c.amount, 0)}</b>
          ),
        },
        {
          title: "Invoices",
          description: `All of the previous invoices you've already paid to RoamJS.`,
          getActions: (i) => [
            { text: "Print", onClick: () => Promise.resolve(print(i.id)) },
          ],
          items: (invoiceLoading ? [] : invoices).map((s) => ({
            id: s.id,
            title: s.name,
            display: `Paid $${s.total} on ${s.date}`,
          })),
          dialogTitle: "Invoices",
          dialogContent: "What would you like to do with this invoice?",
          Component: () => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                variant={"contained"}
                color={"secondary"}
                disabled={invoicePage === 0}
                onClick={() => {
                  setInvoicePage(invoicePage - 1);
                  setInvoiceParams({
                    ending_before: invoices[0].id,
                  });
                }}
              >
                Previous
              </Button>
              <Button
                variant={"contained"}
                color={"primary"}
                disabled={!invoiceHasMore && invoicePage === invoiceMaxPage}
                onClick={() => {
                  setInvoicePage(invoicePage + 1);
                  setInvoiceMaxPage(Math.max(invoicePage, invoiceMaxPage));
                  setInvoiceParams({
                    starting_after: invoices[invoices.length - 1].id,
                  });
                }}
              >
                Next
              </Button>
            </div>
          ),
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
        <BillingTab />
      </SignedIn>
      <RedirectToLogin />
    </Layout>
  );
};

export default UserPage;
