import { Button, StringField } from "@dvargas92495/ui";
import React, { useState } from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Layout>
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
        >
          LOGIN
        </Button>
      </div>
    </Layout>
  );
};

export default LoginPage;
