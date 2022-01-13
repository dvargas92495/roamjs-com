import React, { useCallback, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { Button, Loading, ConfirmationDialog } from "@dvargas92495/ui";
import {
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPut,
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosDelete,
} from "../../components/hooks";
import { SignedIn, UserProfile } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";
import { defaultLayoutProps } from "../../components/Layout";
import { stripe } from "../../components/constants";
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
    ) => { text: string; onClick: () => Promise<unknown> }[];
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
                className={
                  "wKjtxHPVelSpGxgKD4J-K _1OzNYgdyNED3jLWN6DXv1T cl-themed-card"
                }
                key={c.title}
              >
                <div>
                  <h1>{c.title}</h1>
                  <p>{c.description}</p>
                </div>
                {c.items && (
                  <div className="cl-titled-card-list">
                    {c.items.map((i, index) => (
                      <ConfirmationDialog
                        key={i.id}
                        title={c.dialogTitle}
                        content={c.dialogContent}
                        actions={c.getActions(i, index)}
                        Button={({ onClick }) => (
                          <button
                            className="cl-list-item _1qJoyBQenGMr7kHEjL4Krl _2YW23wFdhOB4SEGzozPtqO qlMNWy3GFjlnVDhYmD_84"
                            key={i.id}
                            onClick={onClick}
                          >
                            <div className={"_3cdHQF85GQrVzNyaksJFAn"}>
                              {i.title}
                            </div>
                            <div
                              className={
                                "_377YaX0RVdJAflWkqyk0_W _5doIP53SFIp-tF1LX17if"
                              }
                            >
                              <div>
                                <span className="cl-font-semibold ">
                                  {i.display}
                                </span>
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
                        )}
                      />
                    ))}
                  </div>
                )}
                {c.Component && (
                  <div style={{ paddingTop:24 }}>
                    <c.Component />
                  </div>
                )}
              </div>
            ))}
          </>,
          document.querySelector("div.cl-content") || document.body
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
  interval: "mo" | "yr";
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
          stripe
            .then((s) =>
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

const BillingTab = () => {
  const [payment, setPayment] = useState<PaymentMethod>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  const authenticatedAxiosDel = useAuthenticatedAxiosDelete();
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const getPayment = useCallback(
    () =>
      authenticatedAxios("payment-methods").then((r) => {
        setPayment(r.data.defaultPaymentMethod);
        setPaymentMethods(r.data.paymentMethods);
      }),
    [authenticatedAxios, setPayment, setPaymentMethods]
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
  useEffect(() => {
    getPayment();
    getSubscriptions();
  }, [getPayment]);
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
      }
      cards={[
        {
          title: "Card",
          description: "Default card used to pay for subscribed extensions",
          items: paymentMethods
            .sort((a, b) =>
              a.id === payment.id
                ? -1
                : b.id === payment.id
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
          description:
            "All of the extensions who's premium features you are subscribed to",
          getActions: (i) => [
            { text: "Unsubscribe", onClick: () => unsubscribe(i.id) },
          ],
          items: subscriptions.map((s) => ({
            id: s.id,
            title: s.name,
            display: `$${s.amount} / ${s.interval}`,
          })),
          dialogTitle: "Subscription Actions",
          dialogContent: "What would you like to do with this subscription?",
        },
      ]}
    />
  );
};

const UserPage = (): JSX.Element => {
  return (
    <StandardLayout
      title={"User | RoamJS"}
      description={"Manage your user settings for RoamJS"}
      img={defaultLayoutProps.img}
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

div.cl-component.cl-user-profile div.cl-content {
  margin-left: 24px;
  margin-right: 24px;
}

main>div.roamjs-standard-layout{
  width: unset;
  max-width: unset;
}`}</style>
        </Head>
        <UserProfile />
        <BillingTab />
      </SignedIn>
      <RedirectToLogin />
    </StandardLayout>
  );
};

export default UserPage;
