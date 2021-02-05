import { Button, StringField } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import Layout from "../../components/Layout";
import auth0 from "auth0-js";
import { AUTH0_AUDIENCE, AUTH0_DOMAIN } from "../../components/constants";

const webAuth = new auth0.WebAuth({
  domain: AUTH0_DOMAIN,
  clientID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  audience: AUTH0_AUDIENCE,
  scope: "read:current_user",
});

const LoginPage = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onLogin = useCallback(() => {
    webAuth.client.login(
      {
        realm: "Username-Password-Authentication",
        username: email,
        password,
      },
      (err, authResult) => console.log("err", err, "authResult", authResult)
    );
  }, [email, password]);
  return (
    <Layout>
      <div>UNDER DEVELOPMENT: Embedded Log In Still Not Working</div>
      <div style={{ display: "flex", flexDirection: "column", width: 400 }}>
        <StringField
          variant={"outlined"}
          value={email}
          setValue={setEmail}
          name={"email"}
          label={"email"}
          style={{ margin: "8px 0" }}
        />
        <StringField
          variant={"outlined"}
          value={password}
          setValue={setPassword}
          name={"password"}
          label={"password"}
          style={{ margin: "8px 0" }}
        />
        <Button
          variant={"contained"}
          color={"primary"}
          style={{ margin: "8px 0" }}
          onClick={onLogin}
        >
          LOGIN
        </Button>
      </div>
    </Layout>
  );
};

export default LoginPage;
