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
import { getStripe } from "./constants";
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
  const [showLink, setShowLink] = useState(false);
  useEffect(() => {
    const listener = ((e: CustomEvent) => {
      setShowLink(e.detail === id);
    }) as EventListener;
    document.body.addEventListener("link", listener);
    return () => document.body.removeEventListener("link", listener);
  }, [setShowLink, id]);
  return (
    <div
      id={id}
      onMouseEnter={() =>
        document.body.dispatchEvent(new CustomEvent("link", { detail: id }))
      }
      className={"relative"}
    >
      <span
        onClick={() => {
          window.location.hash = id;
          window.navigator.clipboard.writeText(
            `${window.location.origin}${window.location.pathname}${window.location.hash}`
          );
        }}
        className={`absolute -left-8 cursor-pointer ${
          showLink ? "inline-block" : "hidden"
        } active:bg-gray-200 hover:bg-gray-100 p-2 rounded-full`}
      >
        <svg width={16} height={16} viewBox={"0 0 22 22"}>
          <path
            d={
              "M10.85 11.98l-4.44 4.44-1 1c-.36.36-.86.58-1.41.58-1.1 0-2-.9-2-2 0-.55.22-1.05.59-1.41l5.44-5.44C7.69 9.06 7.36 9 7 9c-1.11 0-2.09.46-2.82 1.18l-.01-.01-3 3 .01.01C.46 13.91 0 14.89 0 16c0 2.21 1.79 4 4 4 1.11 0 2.09-.46 2.82-1.18l.01.01 3-3-.01-.01C10.54 15.09 11 14.11 11 13c0-.36-.06-.69-.15-1.02zM20 4c0-2.21-1.79-4-4-4-1.11 0-2.09.46-2.82 1.18l-.01-.01-3 3 .01.01C9.46 4.91 9 5.89 9 7c0 .36.06.69.15 1.02l4.44-4.44 1-1c.36-.36.86-.58 1.41-.58 1.1 0 2 .9 2 2 0 .55-.22 1.05-.59 1.41l-5.44 5.44c.34.09.67.15 1.03.15 1.11 0 2.09-.46 2.82-1.18l.01.01 3-3-.01-.01C19.54 6.09 20 5.11 20 4zM5 14a1.003 1.003 0 001.71.71l8-8a1.003 1.003 0 00-1.42-1.42l-2 2-2 2-2 2-2 2c-.18.18-.29.43-.29.71z"
            }
            fillRule={"evenodd"}
          />
        </svg>
      </span>
      {children}
    </div>
  );
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

const StartButton = ({ onClick }: { onClick: () => void }) => (
  <Button color={"primary"} variant={"contained"} onClick={onClick}>
    <span style={{ fontWeight: 600, fontSize: 14 }}>Subscribe to Premium</span>
  </Button>
);

const EndButton = ({ id, end }: { id: string; end: () => void }) => {
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const onEnd = useCallback(
    () => authenticatedAxiosPost("end-service", { extension: id }),
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
  refreshUser: () => void;
  signedOut?: boolean;
}> = ({ start, id, refreshUser }) => {
  const {
    query: { started },
  } = useRouter();
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const startService = useCallback(
    () =>
      authenticatedAxiosPost("start-service", {
        extension: id,
      }).then((r) =>
        r.data.sessionId
          ? getStripe().then(
              (s) =>
                s &&
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
        Button={({ onClick }) => <StartButton onClick={onClick} />}
        content={`By clicking submit below, you will subscribe to the premium features of the RoamJS Extension: ${idToTitle(
          id
        )}.`}
        onSuccess={start}
        title={`RoamJS ${idToTitle(id)}`}
        defaultIsOpen={started === "true"}
        disabled={disabled}
      />
    </>
  );
};

const CheckSubscription = ({ id }: { id: string }) => {
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
    <LaunchButton start={start} id={id} refreshUser={() => user.update({})} />
  );
};

const ServiceButton = ({ id }: { id: string }): React.ReactElement => {
  const router = useRouter();
  const login = useCallback(
    () => router.push(`/login?extension=${id}`),
    [router]
  );
  return (
    <div>
      <SignedIn>
        <CheckSubscription id={id} />
      </SignedIn>
      <SignedOut>
        <StartButton onClick={login} />
      </SignedOut>
    </div>
  );
};

const getMdxComponents = ({
  id,
}: {
  id: string;
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
  Premium: () => <ServiceButton id={id} />,
});

export default getMdxComponents;
