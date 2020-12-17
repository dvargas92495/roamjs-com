import React, { useCallback, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Button,
  DataLoader,
  H1,
  H6,
  Items,
  Outlined,
  StringField,
  Subtitle,
} from "@dvargas92495/ui";
import { useAuthenticatedAxios } from "../../components/hooks";
import Link from "next/link";

const Settings = ({ name }: { name: string }) => {
  const [isEditable, setIsEditable] = useState({
    name: false,
  });
  const [editName, setEditName] = useState(name);
  const [balance, setBalance] = useState(0);
  const [funding, setFunding] = useState([]);
  const authenticatedAxios = useAuthenticatedAxios();
  const getBalance = useCallback(
    () =>
      authenticatedAxios("stripe-balance").then((r) =>
        setBalance(r.data.balance)
      ),
    [setBalance]
  );
  useEffect(() => {
    authenticatedAxios("contract-by-email").then((r) =>
      setFunding(
        r.data.contracts.sort(
          (a, b) =>
            new Date(a.createdDate).valueOf() -
            new Date(b.createdDate).valueOf()
        )
      )
    );
  }, [setFunding]);
  return (
    <Items
      items={[
        {
          primary: (
            <div style={{ marginBottom: -24, paddingLeft: 64 }}>
              {isEditable.name ? (
                <StringField value={editName} setValue={setEditName} />
              ) : (
                <H6>{name}</H6>
              )}
            </div>
          ),
          key: 0,
          avatar: <Subtitle>Name</Subtitle>,
          action: isEditable.name ? (
            <Button
              startIcon="save"
              onClick={() => setIsEditable({ ...isEditable, name: false })}
            />
          ) : (
            <Button
              startIcon="edit"
              onClick={() => setIsEditable({ ...isEditable, name: true })}
            />
          ),
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
        ...funding.map((f, i) => ({
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
                marginBottom: i === funding.length - 1 ? -16 : -24,
                paddingLeft: 64,
              }}
            >
              {`$${f.reward} funded on ${f.createdDate} due on ${f.dueDate}`}
            </div>
          ),
          key: i + 2,
          avatar: i === 0 ? <Subtitle>Fund</Subtitle> : <span />,
        })),
      ]}
    />
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
      <H1>User Settings</H1>
      <Outlined>
        {isAuthenticated ? (
          <Settings {...user} />
        ) : error ? (
          <div>{`${error.name}: ${error.message}`}</div>
        ) : (
          <div>Not Logged In</div>
        )}
      </Outlined>
      <div style={{ marginTop: 24 }}>
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
      </div>
    </StandardLayout>
  );
};

export default UserPage;
