import React, { useCallback, useState } from "react";
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
  useAuthenticatedAxios,
  useAuthenticatedAxiosPost,
} from "../../components/hooks";
import Link from "next/link";

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
      <div style={{ marginBottom: -24, paddingLeft: 64 }}>
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
      </div>
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
  const { primary: namePrimary, action: nameAction } = useEditableSetting({
    defaultValue: name,
    name: "name",
  });
  const { primary: emailPrimary, action: emailAction } = useEditableSetting({
    defaultValue: email,
    name: "email",
  });
  return (
    <Items
      items={[
        {
          primary: emailPrimary,
          key: 0,
          avatar: <Subtitle>Email</Subtitle>,
          action: emailAction,
        },
        {
          primary: namePrimary,
          key: 1,
          avatar: <Subtitle>Name</Subtitle>,
          action: nameAction,
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
  const authenticatedAxios = useAuthenticatedAxios();
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
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>
              <DataLoader loadAsync={getPayment}>
                <H6>
                  {payment.brand} ends in {payment.last4}
                </H6>
              </DataLoader>
            </div>
          ),
          key: 0,
          avatar: <Subtitle>Card</Subtitle>,
        },
        {
          primary: (
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>
              <DataLoader loadAsync={getBalance}>
                <H6>${balance}</H6>
              </DataLoader>
            </div>
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
  const authenticatedAxiosGet = useAuthenticatedAxios();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [website, setWebsite] = useState<WebsiteData>();
  const getWebsite = useCallback(
    () =>
      authenticatedAxiosGet("auth-user-metadata").then((r) =>
        setWebsite(r.data.website)
      ),
    [setWebsite]
  );
  const launchWebsite = useCallback(
    (body) => authenticatedAxiosPost("launch-website", body),
    [authenticatedAxiosPost]
  );
  return (
    <DataLoader loadAsync={getWebsite}>
      {website ? (
        <Items
          items={[
            {
              primary: (
                <div style={{ marginBottom: -24, paddingLeft: 64 }}>
                  {website.graph}
                </div>
              ),
              key: 0,
              avatar: <Subtitle>Graph</Subtitle>,
            },
            {
              primary: (
                <div style={{ marginBottom: -24, paddingLeft: 64 }}>
                  {website.status}
                </div>
              ),
              key: 0,
              avatar: <Subtitle>Status</Subtitle>,
            },
          ]}
        />
      ) : (
        <>
          <Body>
            You don't currently have a live Roam site. Click the button below to
            start!
          </Body>
          <FormDialog
            onSave={launchWebsite}
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
          primary: (
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>TODO</div>
          ),
          key: 1,
          avatar: <Subtitle>Google</Subtitle>,
        },
        {
          primary: (
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>TODO</div>
          ),
          key: 2,
          avatar: <Subtitle>Twitter</Subtitle>,
        },
      ]}
    />
  );
};

const Funding = () => {
  const [items, setItems] = useState([]);
  const authenticatedAxios = useAuthenticatedAxios();
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
        items={items.map((f, i) => ({
          primary: (
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>
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
            </div>
          ),
          secondary: (
            <div
              style={{
                marginBottom: i === items.length - 1 ? -16 : -24,
                paddingLeft: 64,
              }}
            >
              {`Funded on ${f.createdDate}. Due on ${f.dueDate}`}
            </div>
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
        <Card title={"Connections"}>
          <Connections />
        </Card>
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
