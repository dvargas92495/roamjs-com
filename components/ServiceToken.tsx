import { useUser } from "@clerk/clerk-react";
import { Button, Loading, StringField } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import { idToTitle, useAuthenticatedAxiosPost } from "./hooks";

const GenerateToken: React.FC<{ id: string }> = ({ id }) => {
  const user = useUser();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    authenticatedAxiosPost("token", { service: id })
      .then(() =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore refresh metadata state
        user.update()
      )
      .finally(() => setLoading(false));
  }, [authenticatedAxiosPost, user, id, setLoading]);
  return (
    <div>
      <Button
        onClick={onClick}
        color={"secondary"}
        variant={"outlined"}
        style={{ marginRight: 8 }}
      >
        Generate New Token
      </Button>
      <Loading loading={loading} size={16} />
    </div>
  );
};

const ServiceToken = ({
  id,
  token,
}: {
  id: string;
  token: string;
}): React.ReactElement => {
  return (
    <>
      {token ? (
        <>
          <div style={{ display: "flex" }}>
            <StringField
              value={token}
              disabled
              setValue={() => token}
              label={`RoamJS ${idToTitle(id)} Token`}
              inputProps={{
                style: {
                  fontFamily: "monospace",
                },
              }}
              style={{
                cursor: "text",
                flexGrow: 1,
                paddingRight: 24,
              }}
              toggleable
            />
          </div>
          <span style={{ color: "darkred" }}>
            Token is sensitive. <b>DO NOT SHARE WITH ANYONE</b>
          </span>
        </>
      ) : (
        <span>
          Click the button below to generate a token for this service!
        </span>
      )}
      <div style={{ marginTop: 32 }}>
        <GenerateToken id={id} />
      </div>
    </>
  );
};

export default ServiceToken;
