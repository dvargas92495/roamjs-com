import React, { useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { useUser, useLogout } from "react-manage-users";
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
  const user = useUser();
  const logout = useLogout();
  return (
    <StandardLayout>
      <H1>User Settings</H1>
      <Outlined>
        {user ? <Settings {...user} /> : <div>Not logged in</div>}
      </Outlined>
      <div style={{ marginTop: 24 }}>
        {user && (
          <Button
            size="large"
            variant="contained"
            color="primary"
            onClick={logout}
          >
            Log Out
          </Button>
        )}
      </div>
    </StandardLayout>
  );
};

export default UserPage;
