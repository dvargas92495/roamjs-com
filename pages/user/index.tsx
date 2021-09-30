import React, { useCallback, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import {
  Body,
  Button,
  ButtonProps,
  Card,
  DataLoader,
  H6,
  Items,
  Loading,
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
import { useUser, SignedIn, UserProfile } from "@clerk/clerk-react";
import RedirectToLogin from "../../components/RedirectToLogin";
import { defaultLayoutProps } from "../../components/Layout";
import { stripe } from "../../components/constants";

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
  const axiosGet = useAuthenticatedAxiosGet();
  const axiosPost = useAuthenticatedAxiosPost();
  const axiosDelete = useAuthenticatedAxiosDelete();
  const onNameSave = useCallback(
    (n) => axiosPut("name", { name: n }).then(() => console.log("saved")),
    [axiosPut]
  );
  const { primary: namePrimary } = useEditableSetting({
    defaultValue: name,
    name: "name",
    onSave: onNameSave,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const subscribe = useCallback(() => {
    setLoading(true);
    axiosPost("convertkit")
      .then(() => {
        setIsSubscribed(true);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setIsSubscribed, axiosPut]);
  const unsubscribe = useCallback(() => {
    setLoading(true);
    axiosDelete("convertkit")
      .then(() => {
        setIsSubscribed(false);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setIsSubscribed, axiosDelete]);
  useEffect(() => {
    axiosGet("convertkit")
      .then((r) => setIsSubscribed(r.data.isSubscribed))
      .finally(() => setLoading(false));
  }, [setLoading, setIsSubscribed, axiosGet]);
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
        {
          primary: (
            <UserValue>
              <Body>
                {loading ? (
                  <Loading loading />
                ) : isSubscribed ? (
                  "Subscribed"
                ) : (
                  "Unsubscribed"
                )}
              </Body>
            </UserValue>
          ),
          key: 2,
          avatar: <Subtitle>Digest</Subtitle>,
          action:
            !loading &&
            (isSubscribed ? (
              <Button
                variant={"outlined"}
                color={"secondary"}
                onClick={unsubscribe}
              >
                Unsubscribe
              </Button>
            ) : (
              <Button
                variant={"contained"}
                color={"primary"}
                onClick={subscribe}
              >
                Subscribe
              </Button>
            )),
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

const ApiButton: React.FunctionComponent<
  {
    request: () => Promise<void>;
    disabled?: boolean;
  } & Pick<ButtonProps, "color" | "variant" | "style">
> = ({ children, request, disabled, ...bprops }) => {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    request().catch(() => setLoading(false));
  }, [setLoading, request]);
  return (
    <>
      <Button onClick={onClick} disabled={disabled || loading} {...bprops}>
        {children}
      </Button>
      <Loading loading={loading} size={16} />
    </>
  );
};

const Billing = () => {
  const [payment, setPayment] = useState<PaymentMethod>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
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
  const addCard = useCallback(
    () =>
      authenticatedAxiosPost("payment-methods").then(
        (r) =>
          r.data.id &&
          stripe
            .then((s) =>
              s.redirectToCheckout({
                sessionId: r.data.id,
              })
            )
            .then(() => Promise.resolve())
      ),
    [authenticatedAxiosPost]
  );
  const unsubscribe = useCallback(
    (subscription) => () =>
      authenticatedAxiosPost("end-service", { subscription }).then(() =>
        setSubscriptions(subscriptions.filter((s) => s.id !== subscription))
      ),
    [authenticatedAxiosPost]
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
            action: (
              <ApiButton
                request={addCard}
                variant={"outlined"}
                color={"secondary"}
              >
                Add Card
              </ApiButton>
            ),
          },
        ]}
      />
      <hr />
      <H6>Services</H6>
      <DataLoader loadAsync={getSubscriptions}>
        <Items
          items={subscriptions.map((p) => ({
            primary: <UserValue>{p.name}</UserValue>,
            secondary: (
              <UserValue>
                <span style={{ paddingRight: 96, display: "block" }}>
                  {p.description}
                </span>
              </UserValue>
            ),
            key: p.id,
            avatar: (
              <Subtitle>
                ${p.amount}/{p.interval}
              </Subtitle>
            ),
            action: (
              <ApiButton
                request={unsubscribe(p.id)}
                variant={"outlined"}
                color={"secondary"}
                style={{ fontSize: "0.75rem" }}
              >
                Unsubscribe
              </ApiButton>
            ),
          }))}
          noItemMessage="No Currently Subscribed Services"
        />
      </DataLoader>
    </>
  );
};

const Funding = () => {
  const [items, setItems] = useState([]);
  const authenticatedAxios = useAuthenticatedAxiosGet();
  const authenticatedDelete = useAuthenticatedAxiosDelete();
  const loadItems = useCallback(
    () =>
      authenticatedAxios("sponsorships").then((r) => {
        setItems([
          ...r.data.projects,
          ...r.data.contracts
            .sort(
              (a, b) =>
                new Date(a.createdDate).valueOf() -
                new Date(b.createdDate).valueOf()
            )
            .map((c) => ({ ...c, isContract: true })),
        ]);
      }),
    [setItems, authenticatedAxios]
  );
  return (
    <DataLoader loadAsync={loadItems}>
      <Items
        items={items.map((f) => ({
          primary: (
            <UserValue>
              <H6>
                <Link href={f.link}>{f.name}</Link>
              </H6>
            </UserValue>
          ),
          secondary: <UserValue>{f.description}</UserValue>,
          key: f.uuid,
          avatar: <Subtitle>${f.funding}</Subtitle>,
          action: (
            <ApiButton
              request={() =>
                authenticatedDelete(
                  `project-fund?uuid=${f.uuid}${
                    f.isContract ? `&contract=true` : ""
                  }`
                ).then(() => setItems(items.filter((i) => i.uuid != f.uuid)))
              }
            >
              Remove
            </ApiButton>
          ),
        }))}
      />
    </DataLoader>
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
          <Card title={"Details"} className={"roamjs-user-card"}>
            <Settings
              name={user.fullName}
              email={user.primaryEmailAddress.emailAddress}
            />
          </Card>
          <Card title={"Billing"} className={"roamjs-user-card"}>
            <Billing />
          </Card>
          <Card title={"Projects"} className={"roamjs-user-card"}>
            <Funding />
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
    <StandardLayout
      title={"User | RoamJS"}
      description={"Manage your user settings for RoamJS"}
      img={defaultLayoutProps.img}
    >
      <SignedIn>
        <Profile />
      </SignedIn>
      <RedirectToLogin />
    </StandardLayout>
  );
};

export default UserPage;
