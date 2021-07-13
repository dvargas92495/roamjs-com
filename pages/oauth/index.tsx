import { Loading, Root } from "@dvargas92495/ui";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import axios from "axios";
import { API_URL } from "../../components/constants";

const OauthPage = (): React.ReactElement => {
  const [loading, setLoading] = useState(false);
  const [mock, setMock] = useState("");
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      const query = new URLSearchParams(window.location.search);
      const isAuth = query.get("auth");
      const mockService = query.get("mock");
      if (isAuth) {
        const params = {};
        const hashParams = new URLSearchParams(
          window.location.hash.replace("#", "?")
        );
        Array.from(query.entries())
          .concat(Array.from(hashParams.entries()))
          .filter(([k]) => k !== "auth" && k !== "state")
          .forEach(([k, v]) => (params[k] = v));
        const auth = JSON.stringify(params);
        window.opener.postMessage(auth, "https://roamresearch.com");
        const state = query.get("state");
        if (state) {
          axios.post(`${API_URL}/auth`, { state, auth });
        }
      } else if (mockService) {
        setMock(mockService);
      }
    }
  }, [setMock]);
  return (
    <Root>
      {!mock ? (
        <img
          src={"/images/logo-high-res.jpg"}
          style={{ maxHeight: "100vh", maxWidth: "100vw" }}
        />
      ) : (
        <>
          <h5>Mock Login for {mock}</h5>
          <p>
            This page is a mock oauth flow until {mock} implements oauth. Click
            the button below to simulate the flow.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              window.location.assign(
                `${window.location.origin}/oauth?auth=true&code=${v4()}`
              );
            }}
            style={{ width: 200 }}
          >
            Log In
          </button>
          <Loading loading={loading} />
        </>
      )}
    </Root>
  );
};

export default OauthPage;
