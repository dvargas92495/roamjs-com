import { Button, Icon, Spinner } from "@blueprintjs/core";
import React, { useState, useCallback } from "react";
import { toTitle } from "./hooks";

export type ExternalLoginOptions = {
  service: string;
  getPopoutUrl: () => Promise<string>;
  getAuthData: (d: string) => Promise<Record<string, string>>;
  ServiceIcon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
};

const ExternalLogin = ({
  onSuccess,
  parentUid,
  service,
  getPopoutUrl,
  getAuthData,
  ServiceIcon,
}: {
  onSuccess: (block: { text: string; uid: string }) => void;
  parentUid: string;
} & ExternalLoginOptions): React.ReactElement => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onClick = useCallback(() => {
    setLoading(true);
    getPopoutUrl()
      .then((url) => {
        const width = 400;
        const height = 350;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        const loginWindow = window.open(
          url,
          `roamjs:${service}:login`,
          `left=${left},top=${top},width=${width},height=${height},status=1`
        );
        const messageEventListener = (e: MessageEvent) => {
          if (e.origin === "https://roamjs.com") {
            loginWindow.close();
            getAuthData(e.data)
              .then((rr) => {
                const blockUid = window.roamAlphaAPI.util.generateUID();
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": parentUid, order: 0 },
                  block: { string: "oauth", uid: blockUid },
                });
                const valueUid = window.roamAlphaAPI.util.generateUID();
                const block = {
                  string: JSON.stringify(rr),
                  uid: valueUid,
                };
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": blockUid, order: 0 },
                  block,
                });
                window.roamAlphaAPI.updateBlock({
                  block: { open: false, string: "oauth", uid: blockUid },
                });
                onSuccess({ text: block.string, uid: block.uid });
              })
              .finally(() =>
                window.removeEventListener("message", messageEventListener)
              );
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
                style={{
                  width: 15,
                  height: 15,
                  marginLeft: 4,
                  cursor: "pointer",
                }}
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
        <div style={{ color: "red", whiteSpace: "pre-line" }}>{error}</div>
      )}
    </>
  );
};

export default ExternalLogin;
