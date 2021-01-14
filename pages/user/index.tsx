import React, { useCallback, useEffect, useRef, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Body,
  Button,
  Card,
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
  useAuthenticatedAxiosPost,
  useAuthenticatedAxiosPut,
  useAuthenticatedAxiosRoamJSGet,
} from "../../components/hooks";
import Link from "next/link";

const UserValue: React.FunctionComponent = ({ children }) => (
  <div style={{ marginBottom: -24, paddingLeft: 64 }}>{children}</div>
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
  const [balance, setBalance] = useState(0);
  const [payment, setPayment] = useState<{
    brand?: string;
    last4?: string;
    id?: string;
  }>({});
  const authenticatedAxios = useAuthenticatedAxiosFlossGet();
  const getBalance = useCallback(
    () =>
      authenticatedAxios("stripe-balance").then((r) =>
        setBalance(r.data.balance)
      ),
    [setBalance, authenticatedAxios]
  );
  const getPayment = useCallback(
    () =>
      authenticatedAxios("stripe-payment-methods").then((r) =>
        setPayment(r.data[0])
      ),
    [authenticatedAxios]
  );
  return (
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
      ]}
    />
  );
};

type WebsiteData = {
  url: string;
  graph: string;
  status: string;
};

const Website = () => {
  const authenticatedAxiosGet = useAuthenticatedAxiosRoamJSGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [website, setWebsite] = useState<WebsiteData>();
  const timeoutRef = useRef(0);
  const getWebsite = useCallback(
    () =>
      authenticatedAxiosGet("website-status").then((r) => {
        setWebsite(r.data);
        if (r.data && r.data.status !== "LIVE") {
          timeoutRef.current = window.setTimeout(getWebsite, 5000);
        }
      }),
    [setWebsite, timeoutRef]
  );
  const launchWebsite = useCallback(
    (body) => authenticatedAxiosPost("launch-website", body),
    [authenticatedAxiosPost]
  );
  const shutdownWebsite = useCallback(
    () => authenticatedAxiosPost("shutdown-website", {}).then(getWebsite),
    [authenticatedAxiosPost, timeoutRef, getWebsite]
  );
  useEffect(() => () => clearTimeout(timeoutRef.current), [timeoutRef]);
  return (
    <DataLoader loadAsync={getWebsite}>
      {website ? (
        <>
          <Items
            items={[
              {
                primary: <UserValue>{website.graph}</UserValue>,
                key: 0,
                avatar: <Subtitle>Graph</Subtitle>,
              },
              {
                primary: <UserValue>{website.status}</UserValue>,
                key: 1,
                avatar: <Subtitle>Status</Subtitle>,
              },
            ]}
          />
          <Button
            variant={"contained"}
            color={"primary"}
            style={{ margin: "0 16px" }}
            disabled={website.status !== "LIVE"}
          >
            Manual Deploy
          </Button>
          <Button
            variant={"contained"}
            color={"secondary"}
            onClick={shutdownWebsite}
          >
            Shutdown
          </Button>
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
              "Fill out the info below and your Roam graph will launch as a site in minutes!"
            }
            formElements={[
              {
                name: "graph",
                defaultValue: "",
                component: StringField,
                validate: () => "",
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
  const [items, setItems] = useState([]);
  const authenticatedAxios = useAuthenticatedAxiosFlossGet();
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
        items={items.map((f) => ({
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
        }))}
      />
    </DataLoader>
  );
};

const UserPage = (): JSX.Element => {
  const { isAuthenticated, error, user, logout } = useAuth0();
  const onLogoutClick = useCallback(
    () =>
      logout({
        returnTo: window.location.origin,
      }),
    [logout]
  );
  return (
    <StandardLayout>
      <VerticalTabs title={"User Info"}>
        <Card title={"Details"}>
          {isAuthenticated ? (
            <Settings {...user} />
          ) : error ? (
            <div>{`${error.name}: ${error.message}`}</div>
          ) : (
            <div>Not Logged In</div>
          )}
        </Card>
        {/*<Card title={"Connections"}>
          <Connections />
          </Card>*/}
        <Card title={"Billing"}>
          <Billing />
        </Card>
        <Card title={"Website"}>
          <Website />
        </Card>
        <Card title={"Funding"}>
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
