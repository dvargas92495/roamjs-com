import { Root } from "@dvargas92495/ui";
import React, { useEffect } from "react";

const OauthPage = (): React.ReactElement => {
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      const query = new URLSearchParams(window.location.search);
      const isAuth = query.get("auth");
      if (isAuth) {
        const params = {};
        Array.from(query.entries())
          .filter(([k]) => k !== "auth")
          .forEach(([k, v]) => (params[k] = v));
        window.opener.postMessage(
          JSON.stringify(params),
          "https://roamresearch.com"
        );
      }
    }
  }, []);
  return (
    <Root>
      <img
        src={"/images/logo-high-res.jpg"}
        style={{ maxHeight: "100vh", maxWidth: "100vw" }}
      />
    </Root>
  );
};

export default OauthPage;
