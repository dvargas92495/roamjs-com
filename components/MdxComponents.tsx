import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  LI,
  Button,
  ConfirmationDialog,
} from "@dvargas92495/ui";
import React, { useCallback, useEffect, useState } from "react";
import Loom from "./Loom";
import YouTube from "./Youtube";
import { Prism } from "react-syntax-highlighter";
import DemoVideo from "./DemoVideo";
import { useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import { stripe } from "./constants";
import {
  useAuthenticatedAxiosPost,
  idToTitle,
  useAuthenticatedAxiosGet,
  idToCamel,
} from "./hooks";

const Pre: React.FunctionComponent<HTMLPreElement> = ({ children }) => (
  <>{children}</>
);

const Code: React.FunctionComponent<HTMLElement> = ({
  className,
  children,
}) => {
  return (
    <Prism language={(className || "").substring("language-".length)}>
      {typeof children === "string" ? children.trim() : children}
    </Prism>
  );
};

const InlineCode: React.FunctionComponent = ({ children }) => (
  <code
    style={{ backgroundColor: "#33333320", borderRadius: 4, padding: "0 4px" }}
  >
    {children}
  </code>
);

const MdxImage = (
  props: React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >
): React.ReactElement => (
  <img
    {...props}
    style={{
      maxWidth: 480,
      boxShadow: "0px 3px 14px #00000040",
      borderRadius: 8,
      margin: "64px auto",
      display: "block",
    }}
  />
);

export const Center: React.FunctionComponent = ({ children, ...props }) => {
  return (
    <div style={{ textAlign: "center" }} {...props}>
      {children}
    </div>
  );
};

const Highlight: React.FunctionComponent = ({ children }) => {
  return <span style={{ backgroundColor: "#ffff00" }}>{children}</span>;
};

const Block: React.FunctionComponent<{ id: string }> = ({ id, children }) => {
  return <div id={id}>{children}</div>;
};

const Blockquote: React.FunctionComponent<{ id: string }> = ({ children }) => {
  return (
    <blockquote
      style={{
        backgroundColor: "#F5F8FA",
        borderLeft: "5px solid #30404D",
        fontSize: 14,
        margin: "0 0 10px",
        wordWrap: "break-word",
        padding: 4,
      }}
    >
      {children}
    </blockquote>
  );
};

const StartButton = ({
  price,
  onClick,
}: {
  price: string;
  onClick: () => void;
}) => (
  <>
    <Body>
      You could subscribe directly from within Roam, or by clicking the button
      below!
    </Body>
    <Button color={"primary"} variant={"contained"} onClick={onClick}>
      <span style={{ fontSize: 14 }}>Start for</span>
      <span style={{ fontWeight: 600, fontSize: 14, marginLeft: 4 }}>
        {price}
      </span>
    </Button>
  </>
);

const EndButton = ({ id, end }: { id: string; end: () => void }) => {
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const onEnd = useCallback(
    () => authenticatedAxiosPost("end-service", { service: id }),
    [authenticatedAxiosPost]
  );
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        height: "100%",
        alignItems: "center",
      }}
    >
      <div>
        <Body>Click the button below to remove these premium features.</Body>
        <ConfirmationDialog
          buttonText={"End Subscription"}
          color="secondary"
          title={`Ending ${idToTitle(id)}`}
          content={`Are you sure you want to unsubscribe from the premium features of RoamJS ${idToTitle(
            id
          )}?`}
          action={onEnd}
          onSuccess={end}
        />
      </div>
    </div>
  );
};

const LaunchButton: React.FC<{
  start: () => void;
  id: string;
  price: string;
  refreshUser: () => void;
  signedOut?: boolean;
}> = ({ start, id, price, refreshUser }) => {
  const {
    query: { started },
  } = useRouter();
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const startService = useCallback(
    () =>
      authenticatedAxiosPost("start-service", {
        service: id,
        query: window.location.search.slice(1),
      }).then((r) =>
        r.data.sessionId
          ? stripe.then((s) =>
              s
                .redirectToCheckout({
                  sessionId: r.data.sessionId,
                })
                .catch((e) => console.error(e))
            )
          : refreshUser()
      ),
    [authenticatedAxiosPost]
  );
  const [disabled, setDisabled] = useState(true);
  useEffect(() => {
    const checkStripe = () =>
      authenticatedAxiosGet("connected?key=stripeId")
        .then((r) => {
          if (r.data.connected) {
            setDisabled(false);
          } else {
            setTimeout(checkStripe, 1000);
          }
        })
        .catch(() => setTimeout(checkStripe, 5000));
    checkStripe();
  }, [authenticatedAxiosGet]);
  return (
    <>
      <ConfirmationDialog
        action={startService}
        Button={({ onClick }) => (
          <StartButton onClick={onClick} price={price} />
        )}
        content={`By clicking submit below, you will subscribe to the premium features of the RoamJS Extension: ${idToTitle(
          id
        )} for ${price}.`}
        onSuccess={start}
        title={`RoamJS ${idToTitle(id)}`}
        defaultIsOpen={started === "true"}
        disabled={disabled}
      />
    </>
  );
};

const CheckSubscription = ({ id, price }: { id: string; price: string }) => {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), [setStarted]);
  const end = useCallback(() => setStarted(false), [setStarted]);
  const user = useUser();
  const { publicMetadata } = user;
  useEffect(() => {
    if (publicMetadata[idToCamel(id)]) {
      start();
    }
  }, [start, publicMetadata, id]);
  return started ? (
    <EndButton id={id} end={end} />
  ) : (
    <LaunchButton
      start={start}
      id={id}
      price={price}
      refreshUser={() => user.update({})}
    />
  );
};

const ServiceButton = ({
  id,
  price,
}: {
  id: string;
  price: string;
}): React.ReactElement => {
  const router = useRouter();
  const login = useCallback(
    () => router.push(`/login?extension=${id}`),
    [router]
  );
  return (
    <div>
      <SignedIn>
        <CheckSubscription id={id} price={price} />
      </SignedIn>
      <SignedOut>
        <StartButton onClick={login} price={price} />
      </SignedOut>
    </div>
  );
};

const getMdxComponents = ({
  id,
  premium,
}: {
  id: string;
  premium: { price: number; usage?: "metered" | "licensed" };
}): Record<string, React.ReactNode> => ({
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Body,
  code: Code,
  inlineCode: InlineCode,
  pre: Pre,
  img: MdxImage,
  li: LI,
  Loom,
  YouTube,
  Center,
  Highlight,
  Block,
  DemoVideo,
  blockquote: Blockquote,
  Premium: () => (
    <ServiceButton
      id={id}
      price={`$${premium.price}${
        premium.usage === "metered" ? " per use" : ""
      }/mo`}
    />
  ),
});

export default getMdxComponents;
