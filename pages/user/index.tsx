import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import {
  Body,
  Button,
  Card,
  DataLoader,
  ExternalLink,
  H6,
  IconButton,
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
  useAuthenticatedAxiosDelete,
} from "../../components/hooks";
import Link from "next/link";
import { stripe } from "../../components/constants";
import { useUser, SignedIn, UserProfile } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";
import ServiceToken from "../../components/ServiceToken";

const UserValue: React.FunctionComponent = ({ children }) => (
  <span style={{ paddingLeft: 64, display: "block" }}>{children}</span>
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

const ApiButton: React.FunctionComponent<{ request: () => Promise<void> }> = ({
  children,
  request,
}) => {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    request().catch(() => setLoading(false));
  }, [setLoading, request]);
  return (
    <>
      <Button onClick={onClick}>{children}</Button>
      <Loading loading={loading} size={16} />
    </>
  );
};

const Billing = () => {
  const [payment, setPayment] = useState<PaymentMethod>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedAxiosPut = useAuthenticatedAxiosPut();
  const authenticatedAxiosDel = useAuthenticatedAxiosDelete();
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
                            <ApiButton
                              request={() =>
                                authenticatedAxiosPut("payment-methods", {
                                  id: pm.id,
                                }).then(() =>
                                  setPayment(
                                    paymentMethods.find((p) => p.id === pm.id)
                                  )
                                )
                              }
                            >
                              Make Default
                            </ApiButton>
                            <ApiButton
                              request={() =>
                                authenticatedAxiosDel(
                                  `payment-methods?payment_method_id=${pm.id}`
                                ).then(() =>
                                  setPaymentMethods(
                                    paymentMethods.filter((p) => p.id !== pm.id)
                                  )
                                )
                              }
                            >
                              Delete
                            </ApiButton>
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

const Developer = () => {
  const data = (useUser().publicMetadata as {
    developer?: { token: string; paths: string[] };
  })?.["developer"];
  const [paths, setPaths] = useState<string[]>(data?.paths || []);
  const [newPath, setNewPath] = useState("");
  const [loading, setLoading] = useState(false);
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const authenticatedAxiosDelete = useAuthenticatedAxiosDelete();
  return (
    <div>
      <ServiceToken id={"developer"} token={data?.token} />
      <Items
        items={paths.map((p) => ({
          primary: <UserValue>{p}</UserValue>,
          key: p,
          action: (
            <IconButton
              icon={"delete"}
              onClick={() => {
                setLoading(true);
                authenticatedAxiosDelete(`request-path?path=${p}`).then((r) =>
                  setPaths(r.data.paths)
                )
                .finally(() => setLoading(false));
              }}
            />
          ),
        }))}
        noItemMessage={null}
      />
      <div style={{ marginTop: 16 }}>
        <StringField value={newPath} setValue={setNewPath} label={"Path"} />
        <Button
          onClick={() => {
            setLoading(true);
            authenticatedAxiosPost("request-path", { path: newPath })
              .then((r) => {
                setNewPath("");
                setPaths(r.data.paths);
              })
              .finally(() => setLoading(false));
          }}
          variant={"outlined"}
          style={{ marginLeft: 16 }}
          color={"primary"}
        >
          Request Path
        </Button>
        <Loading loading={loading} size={16} />
      </div>
    </div>
  );
};

const Profile = () => {
  const user = useUser();
  const [isClerk, setIsClerk] = useState(false);
  return (
    <>
      {isClerk ? (
        <UserProfile />
      ) : (
        <VerticalTabs title={"User Info"}>
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
          <Card title={"Developer"}>
            <Developer />
          </Card>
        </VerticalTabs>
      )}
      <button onClick={() => setIsClerk(!isClerk)} style={{ display: "none" }}>
        switch
      </button>
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
