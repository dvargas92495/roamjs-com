import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import StandardLayout from "../../components/StandardLayout";
import {
  Body,
  Button,
  Card,
  ConfirmationDialog,
  DataLoader,
  ExternalLink,
  FormDialog,
  H6,
  Items,
  Loading,
  NumberField,
  StringField,
  Subtitle,
  VerticalTabs,
} from "@dvargas92495/ui";
import {
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPut,
  useAuthenticatedAxiosPost,
} from "../../components/hooks";
import Link from "next/link";
import axios, { AxiosResponse } from "axios";
import { FLOSS_API_URL, stripe } from "../../components/constants";
import awsTlds from "../../components/aws_tlds";
import { useUser, SignedIn } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";

const UserValue: React.FunctionComponent = ({ children }) => (
  <span style={{ marginBottom: -24, paddingLeft: 64, display: "block" }}>
    {children}
  </span>
);

const handleCheckout = (r: AxiosResponse) =>
  r.data.sessionId &&
  stripe.then((s) =>
    s.redirectToCheckout({
      sessionId: r.data.sessionId,
    })
  );

const useEditableSetting = ({
  name,
  defaultValue,
  onSave = () => Promise.resolve(),
}: {
  name: string;
  defaultValue: string;
  onSave?: (value: string) => Promise<void>;
}) => {
  const [isEditable, setIsEditable] = useState(false);
  const [value, setValue] = useState(defaultValue);
  return {
    primary: (
      <UserValue>
        {isEditable ? (
          <StringField
            value={value}
            name={name}
            setValue={setValue}
            label={name}
            type={name === "password" ? "password" : "type"}
          />
        ) : (
          <Body>{defaultValue}</Body>
        )}
      </UserValue>
    ),
    action: isEditable ? (
      <Button
        startIcon="save"
        onClick={() => onSave(value).then(() => setIsEditable(false))}
      />
    ) : (
      <Button startIcon="edit" onClick={() => setIsEditable(true)} />
    ),
  };
};

const Settings = ({ name, email }: { name: string; email: string }) => {
  const axiosPut = useAuthenticatedAxiosPut();
  const onNameSave = useCallback(
    (n) => axiosPut("name", { name: n }).then(() => console.log("saved")),
    [axiosPut]
  );
  const { primary: namePrimary } = useEditableSetting({
    defaultValue: name,
    name: "name",
    onSave: onNameSave,
  });
  return (
    <Items
      items={[
        {
          primary: <UserValue>{email}</UserValue>,
          key: 0,
          avatar: <Subtitle>Email</Subtitle>,
        },
        {
          primary: namePrimary,
          key: 1,
          avatar: <Subtitle>Name</Subtitle>,
          //  action: nameAction,
        },
      ]}
    />
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

const Billing = () => {
  const [payment, setPayment] = useState<PaymentMethod>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const getPayment = useCallback(
    () =>
      authenticatedAxios("payment-methods").then((r) => {
        setPayment(r.data.defaultPaymentMethod);
        setPaymentMethods(r.data.paymentMethods);
      }),
    [authenticatedAxios, setPayment, setPaymentMethods]
  );
  const getSubscriptions = useCallback(
    () =>
      authenticatedAxios("subscriptions").then((r) =>
        setSubscriptions(r.data.subscriptions)
      ),
    [setSubscriptions]
  );
  return (
    <>
      <Items
        items={[
          {
            primary: (
              <UserValue>
                <DataLoader loadAsync={getPayment}>
                  {payment ? (
                    <Body>
                      {payment.brand} ends in {payment.last4}
                    </Body>
                  ) : (
                    <Body>No default card saved!</Body>
                  )}
                  <Items
                    items={paymentMethods
                      .filter((pm) => pm.id !== payment?.id)
                      .map((pm) => ({
                        primary: `${pm.brand} ends in ${pm.last4}`,
                        key: pm.id,
                        action: (
                          <>
                            <Button>Make Default</Button>
                            <Button
                              onClick={() =>
                                axios
                                  .delete(
                                    `${FLOSS_API_URL}/stripe-payment-method?payment_method_id=${pm.id}`
                                  )
                                  .then(() =>
                                    setPaymentMethods(
                                      paymentMethods.filter(
                                        (p) => p.id !== pm.id
                                      )
                                    )
                                  )
                              }
                            >
                              Delete
                            </Button>
                          </>
                        ),
                      }))}
                    noItemMessage={null}
                  />
                </DataLoader>
              </UserValue>
            ),
            key: 0,
            avatar: <Subtitle>Card</Subtitle>,
          },
        ]}
      />
      <hr />
      <H6>Services</H6>
      <DataLoader loadAsync={getSubscriptions}>
        <Items
          items={subscriptions.map((p) => ({
            primary: <UserValue>{p.name}</UserValue>,
            secondary: <UserValue>{p.description}</UserValue>,
            key: p.id,
            avatar: (
              <Subtitle>
                ${p.amount}/{p.interval}
              </Subtitle>
            ),
          }))}
          noItemMessage="No Currently Subscribed Services"
        />
      </DataLoader>
    </>
  );
};

const isWebsiteReady = (w: { status: string; deploys: { status: string }[] }) =>
  w.status === "LIVE" && w.deploys.length && w.deploys[0].status === "SUCCESS";

const TLD_REGEX = new RegExp(`\\.${awsTlds.join("|")}`);
const domainValidate = (domain: string) => {
  const valid = TLD_REGEX.test(domain);
  if (!valid) {
    return "Invalid domain. Try a .com!";
  }
  return "";
};

const Social = () => {
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [socialToken, setSocialToken] = useState("");
  const getSocialToken = useCallback(
    () =>
      authenticatedAxiosGet("social-token").then((r) =>
        setSocialToken(r.data.token)
      ),
    [authenticatedAxiosGet]
  );
  const launchSocial = useCallback(
    () => authenticatedAxiosPost("launch-social", {}).then(handleCheckout),
    [authenticatedAxiosPost]
  );
  return (
    <DataLoader loadAsync={getSocialToken}>
      {socialToken ? (
        <>
          <StringField
            value={socialToken}
            disabled
            setValue={setSocialToken}
            label={"RoamJS Social Token"}
            fullWidth
          />
        </>
      ) : (
        <>
          <Body>
            You are not subscribed to RoamJS Social. Click the button below to
            gain access to RoamJS Social automations!
          </Body>
          <ConfirmationDialog
            action={launchSocial}
            buttonText={"Generate Token"}
            content={
              "Click submit below to generate a RoamJS Social token! This service costs $3/month."
            }
            onSuccess={getSocialToken}
            title={"Subscribe to RoamJS Social"}
          />
        </>
      )}
    </DataLoader>
  );
};

const Website = () => {
  const user = useUser();
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [graph, setGraph] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [deploys, setDeploys] = useState<
    { status: string; date: string; uuid: string }[]
  >([]);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [priceId, setPriceId] = useState("");
  const timeoutRef = useRef(0);
  const getStatus = useCallback(
    (graph: string) =>
      authenticatedAxiosGet(`website-status?graph=${graph}`).then((r) => {
        setStatus(r.data.status);
        setDeploys(r.data.deploys);
        if (!isWebsiteReady(r.data)) {
          timeoutRef.current = window.setTimeout(() => getStatus(graph), 5000);
        }
      }),
    [setStatus, setDeploys, timeoutRef]
  );
  const getWebsite = useCallback(
    () =>
      authenticatedAxiosGet("website-status").then((r) => {
        if (r.data) {
          setGraph(r.data.graph);
          setStatus(r.data.status);
          setDeploys(r.data.deploys);
          if (!isWebsiteReady(r.data)) {
            timeoutRef.current = window.setTimeout(
              () => getStatus(r.data.graph),
              5000
            );
          }
        }
      }),
    [setGraph, setStatus, setDeploys, timeoutRef, getStatus]
  );
  const launchWebsite = useCallback(
    (body) =>
      authenticatedAxiosPost("launch-website", {
        ...body,
        priceId,
      }).then(handleCheckout),
    [authenticatedAxiosPost, priceId, user]
  );
  const [loading, setLoading] = useState(false);
  const manualDeploy = useCallback(() => {
    setLoading(true);
    authenticatedAxiosPost("deploy", {})
      .then(() => getStatus(graph))
      .finally(() => setLoading(false));
  }, [authenticatedAxiosPost, getStatus, graph]);
  const shutdownWebsite = useCallback(
    () =>
      authenticatedAxiosPost("shutdown-website", {
        graph,
        subscriptionId,
      }),
    [authenticatedAxiosPost, graph, subscriptionId]
  );
  useEffect(() => () => clearTimeout(timeoutRef.current), [timeoutRef]);
  useEffect(() => {
    authenticatedAxiosGet(
      `is-subscribed?product=${encodeURI("RoamJS Site")}`
    ).then((r) => setSubscriptionId(r.data.subscriptionId));
  }, [authenticatedAxiosGet]);
  useEffect(() => {
    authenticatedAxiosGet("products")
      .then((r) =>
        r.data.products.find((p: { name: string }) => p.name === "RoamJS Site")
      )
      .then((p) => setPriceId(p.prices[0].id));
  }, [authenticatedAxiosGet, setPriceId]);
  const siteDeploying = loading || !isWebsiteReady({ status, deploys });

  return (
    <DataLoader loadAsync={getWebsite}>
      {graph ? (
        <>
          <Items
            items={[
              {
                primary: <UserValue>{graph}</UserValue>,
                key: 0,
                avatar: <Subtitle>Graph</Subtitle>,
              },
              {
                primary: <UserValue>{status}</UserValue>,
                key: 1,
                avatar: <Subtitle>Status</Subtitle>,
              },
            ]}
          />
          <Button
            variant={"contained"}
            color={"primary"}
            style={{ margin: "0 16px" }}
            disabled={siteDeploying}
            onClick={manualDeploy}
          >
            Manual Deploy
          </Button>
          <ConfirmationDialog
            color={"secondary"}
            action={shutdownWebsite}
            buttonText={"Shutdown"}
            content={
              "Are you sure you want to shut down this RoamJS site? This operation is irreversible. Your subscription to this Service will end."
            }
            onSuccess={getWebsite}
            title={"Shutdown RoamJS Static Site Service"}
          />
          <Loading loading={siteDeploying} size={18} />
          <hr style={{ margin: "16px 0" }} />
          <H6>Deploys</H6>
          <Items
            items={deploys.map((d) => ({
              primary: <UserValue>{d.status}</UserValue>,
              key: d.uuid,
              secondary: (
                <UserValue>At {new Date(d.date).toLocaleString()}</UserValue>
              ),
            }))}
          />
        </>
      ) : (
        <>
          <Body>
            You don't currently have a live Roam site. Click the button below to
            start!
          </Body>
          <FormDialog
            onSave={launchWebsite}
            onSuccess={getWebsite}
            buttonText={"LAUNCH"}
            title={"Launch Roam Website"}
            contentText={
              "Fill out the info below and your Roam graph will launch as a site in minutes! This service will cost $12/month"
            }
            formElements={[
              {
                name: "graph",
                defaultValue: "",
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                component: StringField,
                validate: () => "",
              },
              {
                name: "domain",
                defaultValue: "",
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                component: StringField,
                validate: (v) => domainValidate(v as string),
              },
            ]}
          />
        </>
      )}
    </DataLoader>
  );
};

const Funding = () => {
  const [balance, setBalance] = useState(0);
  const [subscriptionId, setSubscriptionId] = useState(0);
  const [sponsorship, setSponsorship] = useState(20);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const getBalance = useCallback(
    () =>
      authenticatedAxios("balance").then((r) =>
        setBalance(parseFloat(r.data.balance))
      ),
    [setBalance, authenticatedAxios]
  );
  const loadItems = useCallback(
    () =>
      Promise.all([
        authenticatedAxios(
          `is-subscribed?product=${encodeURI("RoamJS Sponsor")}`
        ),
        authenticatedAxios("sponsorships"),
      ]).then(([s, r]) => {
        setSubscriptionId(s.data.subscriptionId);
        setItems(
          r.data.contracts.sort(
            (a, b) =>
              new Date(a.createdDate).valueOf() -
              new Date(b.createdDate).valueOf()
          )
        );
      }),
    [setItems, setSubscriptionId, authenticatedAxios]
  );
  const onClick = useCallback(() => {
    setLoading(true);
    authenticatedAxiosPost("subscribe-sponsorship", { sponsorship }).then(
      (r) => {
        if (r.data.active) {
          setLoading(false);
          setSubscriptionId(r.data.id);
          setBalance(balance + sponsorship * 1.25);
        } else {
          stripe.then((s) => s.redirectToCheckout({ sessionId: r.data.id }));
        }
      }
    );
  }, [
    balance,
    sponsorship,
    authenticatedAxiosPost,
    setSubscriptionId,
    setBalance,
  ]);
  return (
    <DataLoader loadAsync={loadItems}>
      {!subscriptionId && (
        <div>
          <Body>
            As a thank you for your recurring support, you will receive 125% of
            your monthly sponsorship amount as RoamJS credit which you could
            then use to prioritize projects on the{" "}
            <ExternalLink href="/queue">Queue</ExternalLink>. You will also be
            added to the <b>Thank You</b> section in the{" "}
            <ExternalLink href="/contribute">Contribute</ExternalLink> page.
          </Body>
          <div
            style={{
              padding: "32px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <NumberField
              value={sponsorship}
              setValue={setSponsorship}
              variant="filled"
              label="Sponsorship"
              dimension="money"
            />
            <Button
              variant={"contained"}
              color={"primary"}
              onClick={onClick}
              disabled={loading}
            >
              SUBSCRIBE
            </Button>
            <Loading loading={loading} />
          </div>
          <Body>
            This ${sponsorship} subscription will give you ${sponsorship * 1.25}{" "}
            in RoamJS credit each month!
          </Body>
        </div>
      )}
      <Items
        items={[
          {
            primary: (
              <UserValue>
                <DataLoader loadAsync={getBalance}>
                  <H6>${balance}</H6>
                </DataLoader>
              </UserValue>
            ),
            key: 1,
            avatar: <Subtitle>Credit</Subtitle>,
          },
          ...items.map((f) => ({
            primary: (
              <UserValue>
                <H6>
                  <Link
                    href={`queue/${f.label}${f.link.substring(
                      "https://github.com/dvargas92495/roam-js-extensions/issues"
                        .length
                    )}`}
                  >
                    {f.name}
                  </Link>
                </H6>
              </UserValue>
            ),
            secondary: (
              <UserValue>
                {`Funded on ${f.createdDate}. Due on ${f.dueDate}`}
              </UserValue>
            ),
            key: f.uuid,
            avatar: <Subtitle>${f.reward}</Subtitle>,
          })),
        ]}
      />
    </DataLoader>
  );
};

const Profile = () => {
  const user = useUser();
  const initialValue = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    const tab = query.get("tab");
    if (tab === "static_site") {
      return 2;
    }
    return 0;
  }, []);
  return (
    <>
      <VerticalTabs title={"User Info"} initialValue={initialValue}>
        <Card title={"Details"}>
          <Settings
            name={user.fullName}
            email={user.primaryEmailAddress.emailAddress}
          />
        </Card>
        <Card title={"Billing"}>
          <Billing />
        </Card>
        <Card title={"Sponsorships"}>
          <Funding />
        </Card>
        <Card title={"Social"}>
          <Social />
        </Card>
        <Card title={"Static Site"}>
          <Website />
        </Card>
      </VerticalTabs>
    </>
  );
};

const UserPage = (): JSX.Element => {
  return (
    <StandardLayout>
      <SignedIn>
        <Profile />
      </SignedIn>
      <RedirectToLogin />
    </StandardLayout>
  );
};

export default UserPage;
