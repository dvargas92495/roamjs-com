import { Button, Icon, Spinner } from "@blueprintjs/core";
import axios from "axios";
import React, { useState, useCallback } from "react";
import { toTitle } from "./hooks";

const ExternalLogin = ({
  onSuccess,
  parentUid,
  service,
  popoutUrl,
  ServiceIcon,
}: {
  onSuccess: (block: {text: string, uid: string}) => void;
  parentUid: string;
  service: string;
  popoutUrl: (s: string) => string;
  ServiceIcon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}): React.ReactElement => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onClick = useCallback(() => {
    setLoading(true);
    axios
      .post(`${process.env.REST_API_URL}/${service}-login`)
      .then((r) => {
        const width = 400;
        const height = 350;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        const loginWindow = window.open(
          popoutUrl(r.data.token),
          `roamjs:${service}:login`,
          `left=${left},top=${top},width=${width},height=${height},status=1`
        );
        const messageEventListener = (e: MessageEvent) => {
          if (e.origin === "https://roamjs.com") {
            loginWindow.close();
            axios
              .post(
                `${process.env.REST_API_URL}/${service}-auth`,
                JSON.parse(e.data)
              )
              .then((rr) => {
                const blockUid = window.roamAlphaAPI.util.generateUID();
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": parentUid, order: 0 },
                  block: { string: "oauth", uid: blockUid },
                });
                const valueUid = window.roamAlphaAPI.util.generateUID();
                const block = { string: JSON.stringify(rr.data), uid: valueUid }
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": blockUid, order: 0 },
                  block,
                });
                window.roamAlphaAPI.updateBlock({
                  block: { open: false, string: "oauth", uid: blockUid },
                });
                window.removeEventListener("message", messageEventListener);
                onSuccess({text: block.string, uid: block.uid});
              });
          }
        };
        window.addEventListener("message", messageEventListener);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [onSuccess, parentUid, setLoading, setError]);
  return (
    <>
      <Button
        icon={
          <Icon
            icon={
              <ServiceIcon
                style={{ width: 15, marginLeft: 4, cursor: "pointer" }}
              />
            }
          />
        }
        onClick={onClick}
        disabled={loading}
      >
        Login With {toTitle(service)}
      </Button>
      {loading && <Spinner size={Spinner.SIZE_SMALL} />}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          {error}
        </div>
      )}
    </>
  );
};

export default ExternalLogin;
