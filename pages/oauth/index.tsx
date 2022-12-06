import { Loading, Root } from "@dvargas92495/ui";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import axios from "axios";
import AES from "crypto-js/aes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const OauthPage = (): React.ReactElement => {
  const [loading, setLoading] = useState(false);
  const [mock, setMock] = useState("");
  const [close, setClose] = useState(false);
  useEffect(() => {
    const params = {};
    const query = new URLSearchParams(window.location.search);
    if (query.get("close")) {
      setClose(true);
      return;
    }
    const hashParams = new URLSearchParams(
      window.location.hash.replace("#", "?")
    );
    Array.from(query.entries())
      .concat(Array.from(hashParams.entries()))
      .filter(([k]) => k !== "auth" && k !== "state")
      .forEach(([k, v]) => (params[k] = v));
    const authData = JSON.stringify(params);
    if (window.opener && window.opener !== window) {
      const isAuth = query.get("auth");
      const mockService = query.get("mock");
      if (isAuth) {
        window.opener.postMessage(authData, "https://roamresearch.com");
      } else if (mockService) {
        setMock(mockService);
      }
    }
    const state = query.get("state");
    if (state) {
      const [service, otp, key] = state.split("_");
      const auth = AES.encrypt(authData, key).toString();
      axios.put(`${API_URL}/oauth`, { service, otp, auth }).then(() => {
        const poll = () =>
          axios.get(`${API_URL}/oauth?state=${service}_${otp}`).then((r) => {
            if (r.data.success) {
              setClose(true);
              window.close();
            } else {
              setTimeout(poll, 1000);
            }
          });
        poll();
      });
    }
  }, [setMock, setClose]);
  return (
    <Root>
      {close && <h3>Success! You may close this window.</h3>}
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
