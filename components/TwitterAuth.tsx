import React, { useEffect } from "react";

const TwitterAuth: React.FunctionComponent = () => {
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      const query = new URLSearchParams(window.location.search);
      const isAuth = query.get("auth");
      if (isAuth) {
        const oauth_token = query.get("oauth_token");
        const oauth_verifier = query.get("oauth_verifier");
        if (oauth_token && oauth_verifier) {
          window.opener.postMessage(
            JSON.stringify({ oauth_token, oauth_verifier }),
            "https://roamresearch.com"
          );
        }
      }
    }
  }, []);
  return <></>;
};

export default TwitterAuth;
