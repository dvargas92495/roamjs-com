import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Button,
  H1,
  H6,
  Items,
  Outlined,
  StringField,
  Subtitle,
} from "@dvargas92495/ui";

const Settings = ({ name }: { name: string }) => {
  const [isEditable, setIsEditable] = useState({
    name: false,
  });
  const [editName, setEditName] = useState(name);
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
      ]}
    />
  );
};

const UserPage = () => {
  const { isAuthenticated, error, user, logout } = useAuth0();
  const onLogoutClick = useCallback(() => logout({
    returnTo: window.location.origin
  }), [logout]);
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
