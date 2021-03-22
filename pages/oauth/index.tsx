import { Root } from "@dvargas92495/ui";
import React from "react";
import TwitterAuth from "../../components/TwitterAuth";

const OauthPage = (): React.ReactElement => {
  return (
    <Root>
      <img
        src={"/images/logo-high-res.jpg"}
        style={{ maxHeight: "100vh", maxWidth: "100vw" }}
      />
      <TwitterAuth />
    </Root>
  );
};

export default OauthPage;
