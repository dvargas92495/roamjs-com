import {
  Breadcrumbs,
  Button,
  ConfirmationDialog,
  H1,
  H4,
  Subtitle,
} from "@dvargas92495/ui";
import React, { useCallback, useEffect, useState } from "react";
import StandardLayout from "./StandardLayout";
import { ServicePageProps } from "./ServicePageCommon";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import marked from "roam-marked";
import { useRouter } from "next/router";
import { useAuthenticatedAxiosPost } from "./hooks";
import { AxiosResponse } from "axios";
import { stripe } from "./constants";

const idToTitle = (id: string) =>
  id
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ");

const idToCamel = (id: string) =>
  `${id.substring(0, 1)}${idToTitle(id).replace(/ /g, "").substring(1)}`;

const handleCheckout = (r: AxiosResponse) =>
  r.data.sessionId &&
  stripe.then((s) =>
    s.redirectToCheckout({
      sessionId: r.data.sessionId,
    })
  );

const LaunchButton: React.FC<{
  start: () => void;
  id: string;
  price: number;
}> = ({ start, id, price }) => {
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const launchSocial = useCallback(
    () => authenticatedAxiosPost(`launch-${id}`, {}).then(handleCheckout),
    [authenticatedAxiosPost]
  );
  return (
    <ConfirmationDialog
      action={launchSocial}
      buttonText={"Start Now"}
      content={`By clicking submit below, you will subscribe to the RoamJS Service: ${idToTitle(
        id
      )} for $${price}/month.`}
      onSuccess={start}
      title={`RoamJS ${idToTitle(id)}`}
    />
  );
};

const CheckSubscription: React.FC<{
  id: string;
  start: () => void;
}> = ({ id, start, children }) => {
  const { publicMetadata } = useUser();
  useEffect(() => {
    if (publicMetadata[idToCamel(id)]) {
      start();
    }
  }, [start, publicMetadata, id]);
  return <>{children}</>;
};

const ServiceLayout = ({
  children,
  development,
  description,
  price,
  image,
  overview,
  id,
}: {
  children: React.ReactNode;
  development?: boolean;
  overview: string;
} & ServicePageProps): React.ReactElement => {
  const [started, setStarted] = useState(false);
  const router = useRouter();
  const start = useCallback(() => setStarted(true), [setStarted]);
  const login = useCallback(() => router.push(`/login?service=${id}`), [
    router,
  ]);
  const SplashLayout: React.FC<{ StartNowButton: React.ReactNode }> = ({
    StartNowButton,
  }) => (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ width: "50%" }}>
          <H1>{idToTitle(id)}</H1>
          <Subtitle>{description}</Subtitle>
          <div style={{ marginBottom: 16 }} />
          <b>${price}/month</b>
          <div>{StartNowButton}</div>
        </div>
        <div style={{ width: "50%", padding: "0 32px" }}>
          <span
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              height: "100%",
            }}
          />
          <img
            src={image}
            style={{
              verticalAlign: "middle",
              width: "100%",
              boxShadow: "0px 3px 14px #00000040",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
      <hr style={{ margin: "32px 0" }} />
      <H4>Overview</H4>
      <div dangerouslySetInnerHTML={{ __html: marked(overview) }} />
    </>
  );
  return (
    <StandardLayout>
      <Breadcrumbs
        page={`${id.replace(/-/g, " ").toUpperCase()}${
          development ? " (UNDER DEVELOPMENT)" : ""
        }`}
        links={[
          {
            text: "SERVICES",
            href: "/services",
          },
        ]}
      />
      <SignedIn>
        <CheckSubscription id={id} start={start}>
          {started ? (
            <div style={{ marginTop: 32 }}>{children}</div>
          ) : (
            <SplashLayout
              StartNowButton={
                <LaunchButton start={start} id={id} price={price} />
              }
            />
          )}
        </CheckSubscription>
      </SignedIn>
      <SignedOut>
        <SplashLayout
          StartNowButton={
            <Button color={"primary"} variant={"contained"} onClick={login}>
              Start Now
            </Button>
          }
        />
      </SignedOut>
    </StandardLayout>
  );
};

export default ServiceLayout;
