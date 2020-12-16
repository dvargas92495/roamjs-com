import React, { useCallback, useState } from "react";
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
import axios from "axios";
import { AUTH0_AUDIENCE, FLOSS_API_URL } from "../../components/constants";

const Settings = ({ name }: { name: string }) => {
  const [isEditable, setIsEditable] = useState({
    name: false,
  });
  const [editName, setEditName] = useState(name);
  const [balance, setBalance] = useState(0);
  const [funding, setFunding] = useState([]);
  const { getAccessTokenSilently } = useAuth0();
  const getBalance = useCallback(
    () =>
      getAccessTokenSilently({
        audience: AUTH0_AUDIENCE,
        scope: "read:current_user",
      }).then((token) =>
        axios
          .get(`${FLOSS_API_URL}/stripe-balance`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((r) => setBalance(r.data.balance))
      ),
    [getAccessTokenSilently, setBalance]
  );
  const getFunding = useCallback(
    () => Promise.resolve().then(() => setFunding([])),
    [setFunding]
  );
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
            <DataLoader loadAsync={getFunding}>
              <H6>${balance}</H6>
            </DataLoader>
          ),
          key: 2,
          avatar: <Subtitle>Funding</Subtitle>,
        })),
      ]}
    />
  );
};

const UserPage = () => {
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
