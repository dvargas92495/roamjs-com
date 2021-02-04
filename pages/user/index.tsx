import React, { useCallback, useEffect, useRef, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Body,
  Button,
  Card,
  ConfirmationDialog,
  DataLoader,
  FormDialog,
  H6,
  Items,
  StringField,
  Subtitle,
  VerticalTabs,
} from "@dvargas92495/ui";
import {
  useAuthenticatedAxiosFlossGet,
  useAuthenticatedAxiosPut,
  useAuthenticatedAxiosRoamJSGet,
  useAuthenticatedAxiosRoamJSPost,
} from "../../components/hooks";
import Link from "next/link";
import axios from "axios";
import { FLOSS_API_URL } from "../../components/constants";
import awsTlds from "../../components/aws_tlds";

const UserValue: React.FunctionComponent = ({ children }) => (
  <span style={{ marginBottom: -24, paddingLeft: 64, display: "block" }}>
    {children}
  </span>
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

const Billing = () => {
  const [payment, setPayment] = useState<{
    brand?: string;
    last4?: string;
    id?: string;
  }>({});
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Set<string>());
  const authenticatedAxios = useAuthenticatedAxiosFlossGet();
  const getPayment = useCallback(
    () =>
      authenticatedAxios("stripe-payment-methods").then((r) =>
        setPayment(r.data[0])
      ),
    [authenticatedAxios]
  );
  const getProducts = useCallback(
    () =>
      axios
        .get(`${FLOSS_API_URL}/stripe-products?project=RoamJS`)
        .then((r) => setProducts(r.data.products)),
    [setProducts]
  );
  const getSubscriptions = useCallback(
    () =>
      authenticatedAxios("stripe-subscriptions").then((r) =>
        setSubscriptions(
          new Set(r.data.subscriptions.map(({ price }) => price))
        )
      ),
    [setSubscriptions]
  );
  const loadAsync = useCallback(
    () =>
      Promise.all([getProducts(), getSubscriptions()]).then(() =>
        console.log("loaded")
      ),
    [getProducts, getSubscriptions]
  );
  return (
    <>
      <Items
        items={[
          {
            primary: (
              <UserValue>
                <DataLoader loadAsync={getPayment}>
                  <H6>
                    {payment.brand} ends in {payment.last4}
                  </H6>
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
      <DataLoader loadAsync={loadAsync}>
        <Items
          items={products
            .filter((p) => subscriptions.has(p.prices[0].id))
            .map((p) => ({
              primary: <UserValue>{p.name}</UserValue>,
              secondary: <UserValue>{p.description}</UserValue>,
              key: p.id,
              avatar: (
                <Subtitle>
                  ${p.prices[0].unit_amount / 100}/
                  {p.prices[0].recurring.interval.substring(0, 2)}
                </Subtitle>
              ),
            }))}
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

const Website = () => {
  const { user } = useAuth0();
  const authenticatedAxiosGet = useAuthenticatedAxiosRoamJSGet();
  const flossGet = useAuthenticatedAxiosFlossGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosRoamJSPost();
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
        email: user?.email,
      }),
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
    flossGet(
      `stripe-is-subscribed?product=${encodeURI("RoamJS Site")}`
    ).then((r) => setSubscriptionId(r.data.subscriptionId));
  }, [flossGet]);
  useEffect(() => {
    flossGet("stripe-products?project=RoamJS")
      .then((r) =>
        r.data.products.find((p: { name: string }) => p.name === "RoamJS Site")
      )
      .then((p) => setPriceId(p.prices[0].id));
  }, [flossGet, setPriceId]);

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
            disabled={!isWebsiteReady({ status, deploys })}
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
            title={"Buy RoamJS Service"}
          />
          {loading && <span>Loading...</span>}
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
                component: StringField,
                validate: () => "",
              },
              {
                name: "domain",
                defaultValue: "",
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Connections = () => {
  const { primary: roamPrimary, action: roamAction } = useEditableSetting({
    name: "password",
    defaultValue: "",
  });
  return (
    <Items
      items={[
        {
          primary: roamPrimary,
          key: 0,
          avatar: <Subtitle>Roam</Subtitle>,
          action: roamAction,
        },
        {
          primary: <UserValue>TODO</UserValue>,
          key: 1,
          avatar: <Subtitle>Google</Subtitle>,
        },
        {
          primary: <UserValue>TODO</UserValue>,
          key: 2,
          avatar: <Subtitle>Twitter</Subtitle>,
        },
      ]}
    />
  );
};

const Funding = () => {
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState([]);
  const authenticatedAxios = useAuthenticatedAxiosFlossGet();
  const getBalance = useCallback(
    () =>
      authenticatedAxios("stripe-balance").then((r) =>
        setBalance(r.data.balance)
      ),
    [setBalance, authenticatedAxios]
  );
  const loadItems = useCallback(
    () =>
      authenticatedAxios("contract-by-email").then((r) =>
        setItems(
          r.data.contracts.sort(
            (a, b) =>
              new Date(a.createdDate).valueOf() -
              new Date(b.createdDate).valueOf()
          )
        )
      ),
    [setItems, authenticatedAxios]
  );
  return (
    <DataLoader loadAsync={loadItems}>
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

const UserPage = (): JSX.Element => {
  const { isAuthenticated, error, user, logout, isLoading } = useAuth0();
  const onLogoutClick = useCallback(
    () =>
      logout({
        returnTo: window.location.origin,
      }),
    [logout]
  );
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.replace("/login");
    }
  }, [isLoading, isAuthenticated]);
  return (
    <StandardLayout>
      <VerticalTabs title={"User Info"}>
        <Card title={"Details"}>
          {isAuthenticated && <Settings {...user} />}
          {error && <div>{`${error.name}: ${error.message}`}</div>}
        </Card>
        {/*<Card title={"Connections"}>
          <Connections />
          </Card>*/}
        <Card title={"Billing"}>
          <Billing />
        </Card>
        <Card title={"Static Site"}>
          <Website />
        </Card>
        <Card title={"Projects Funded"}>
          <Funding />
        </Card>
      </VerticalTabs>
      {isAuthenticated && (
        <Button
          size="large"
          variant="contained"
          color="primary"
          onClick={onLogoutClick}
          style={{ marginTop: 24 }}
        >
          Log Out
        </Button>
      )}
    </StandardLayout>
  );
};

export default UserPage;
