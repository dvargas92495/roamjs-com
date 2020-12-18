import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Button,
  Card,
  DataLoader,
  H1,
  H6,
  Items,
  StringField,
  Subtitle,
  VerticalGridContent,
} from "@dvargas92495/ui";
import { useAuthenticatedAxios } from "../../components/hooks";
import Link from "next/link";

const useEditableSetting = (defaultValue: string) => {
  const [isEditable, setIsEditable] = useState(false);
  const [value, setValue] = useState(defaultValue);
  return {
    primary: (
      <div style={{ marginBottom: -24, paddingLeft: 64 }}>
        {isEditable ? (
          <StringField value={value} setValue={setValue} />
        ) : (
          <H6>{defaultValue}</H6>
        )}
      </div>
    ),
    action: isEditable ? (
      <Button startIcon="save" onClick={() => setIsEditable(false)} />
    ) : (
      <Button startIcon="edit" onClick={() => setIsEditable(true)} />
    ),
  };
};

const Settings = ({
  name,
  email,
}: {
  name: string;
  email: string;
}) => {
  const { primary: namePrimary, action: nameAction } = useEditableSetting(name);
  const { primary: emailPrimary, action: emailAction } = useEditableSetting(
    email
  );
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
      <VerticalGridContent>
        <H1>User Info</H1>
        <Card header={"Details"}>
          {isAuthenticated ? (
            <Settings {...user} />
          ) : error ? (
            <div>{`${error.name}: ${error.message}`}</div>
          ) : (
            <div>Not Logged In</div>
          )}
        </Card>
        <Card header={"Billing"}>
          <Billing />
        </Card>
        <Card header={"Funding"}>
          <Funding />
        </Card>
        {isAuthenticated && (
          <Button
            size="large"
            variant="contained"
            color="primary"
            onClick={onLogoutClick}
          >
            Log Out
          </Button>
        )}
      </VerticalGridContent>
    </StandardLayout>
  );
};

export default UserPage;
