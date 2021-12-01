import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import { Prism } from "react-syntax-highlighter";
import React, { useCallback, useEffect, useState } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { API_URL, stripe } from "../../components/constants";
import StandardLayout from "../../components/StandardLayout";
import { serialize } from "../../components/serverSide";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import matter from "gray-matter";
import {
  getCodeContent,
  getSingleCodeContent,
  idToCamel,
  idToTitle,
  useAuthenticatedAxiosGet,
  useAuthenticatedAxiosPost,
  useCopyCode,
} from "../../components/hooks";
import {
  Body,
  Breadcrumbs,
  Button,
  ExternalLink,
  H1,
  H2,
  H3,
  H4,
  IconButton,
  Subtitle,
  ThankYou,
  ThankYouSponsor,
  isThankYouEmoji,
  CardGrid,
  ConfirmationDialog,
} from "@dvargas92495/ui";
import SponsorDialog from "../../components/SponsorDialog";
import RoamJSDigest from "../../components/RoamJSDigest";
import MdxComponents from "../../components/MdxComponents";
import fs from "fs";
import { isSafari } from "react-device-detect";
import DemoVideo from "../../components/DemoVideo";
import Loom from "../../components/Loom";
import AES from "crypto-js/aes";
import { useRouter } from "next/router";

const StartButtonText = ({ price }: { price: number }) => (
  <>
    <span style={{ fontSize: 14 }}>Start for</span>
    {price === 0 ? (
      <span style={{ fontSize: 14, marginLeft: 4 }}>Free</span>
    ) : (
      <>
        <span style={{ fontWeight: 600, fontSize: 18, marginLeft: 4 }}>
          ${price}
        </span>
        <span style={{ textTransform: "none" }}>/mo</span>
      </>
    )}
  </>
);

const Service = ({
  id,
  end,
  onToken,
}: {
  id: string;
  end: () => void;
  onToken?: (s: string) => void;
}) => {
  const userData = useUser().publicMetadata as {
    [key: string]: { token: string; };
  };
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const camel = idToCamel(id);
  const {
    token = "NO TOKEN FOUND FOR USER",
  } = userData?.[camel];
  const onEnd = useCallback(
    () => authenticatedAxiosPost("end-service", { service: id }),
    [authenticatedAxiosPost]
  );
  useEffect(() => {
    onToken(token);
  }, [onToken]);
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
        <ConfirmationDialog
          buttonText={"End Service"}
          color="secondary"
          title={`Ending ${idToTitle(id)}`}
          content={`Are you sure you want to unsubscribe from the RoamJS ${idToTitle(
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
  price: number;
  refreshUser: () => void;
}> = ({ start, id, price, refreshUser }) => {
  const {
    query: { started },
  } = useRouter();
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosPost = useAuthenticatedAxiosPost();
  const startService = useCallback(
    () =>
      authenticatedAxiosPost(price === 0 ? "token" : "start-service", {
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
    <ConfirmationDialog
      action={startService}
      buttonText={<StartButtonText price={price} />}
      content={`By clicking submit below, you will subscribe to the RoamJS Service: ${idToTitle(
        id
      )}${price > 0 ? ` for $${price}/month` : ""}.`}
      onSuccess={start}
      title={`RoamJS ${idToTitle(id)}`}
      defaultIsOpen={started === "true"}
      disabled={disabled}
    />
  );
};

const CheckSubscription = ({
  id,
  start,
  children,
  price,
}: {
  id: string;
  start: () => void;
  price: number;
  children: (button: React.ReactNode) => React.ReactNode;
}) => {
  const user = useUser();
  const { publicMetadata } = user;
  useEffect(() => {
    if (publicMetadata[idToCamel(id)]) {
      start();
    }
  }, [start, publicMetadata, id]);
  return (
    <>
      {children(
        <LaunchButton
          start={start}
          id={id}
          price={price}
          refreshUser={() =>
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore refresh metadata state
            user.update({})
          }
        />
      )}
    </>
  );
};

export const ServiceButton = ({
  id,
  price,
  SplashLayout,
  onToken,
}: {
  id: string;
  price: number;
  SplashLayout: (props: {
    StartNowButton: React.ReactNode;
  }) => React.ReactElement;
  onToken?: (s: string) => void;
}): React.ReactElement => {
  const [started, setStarted] = useState(false);
  const router = useRouter();
  const start = useCallback(() => setStarted(true), [setStarted]);
  const end = useCallback(() => setStarted(false), [setStarted]);
  const login = useCallback(
    () => router.push(`/login?extension=${id}`),
    [router]
  );
  return (
    <>
      <SignedIn>
        <CheckSubscription id={id} start={start} price={price}>
          {(StartNowButton) =>
            started ? (
              <Service
                id={id}
                end={end}
                onToken={onToken}
              />
            ) : (
              <SplashLayout StartNowButton={StartNowButton} />
            )
          }
        </CheckSubscription>
      </SignedIn>
      <SignedOut>
        <SplashLayout
          StartNowButton={
            <Button color={"primary"} variant={"contained"} onClick={login}>
              <StartButtonText price={price} />
            </Button>
          }
        />
      </SignedOut>
    </>
  );
};

const ExtensionPage = ({
  content,
  id,
  description,
  development,
  sponsors,
  entry,
  premium,
  author = {
    name: "RoamJS",
    email: "support@roamjs.com",
  },
  //@deprecated
  loom,
  skipDemo,
  legacy,
}: {
  id: string;
  content: MDXRemoteSerializeResult;
  description: string;
  development: boolean;
  entry: string;
  sponsors?: ThankYouSponsor[];
  premium: {
    description: string;
    price: number;
  } | null;
  author?: {
    name: string;
    email: string;
  };
  //@deprecated
  loom: string;
  skipDemo: boolean; // only in video extension
  legacy: boolean;
}): React.ReactElement => {
  const [randomItems, setRandomItems] = useState([]);
  const total = randomItems.length;
  const title = idToTitle(id);
  const [copied, setCopied] = useState(false);
  const [initialLines, setInitialLines] = useState("");
  const onSave = useCopyCode(setCopied, initialLines);
  const mainEntry = legacy ? id : `${id}/main`;
  const [pagination, setPagination] = useState(0);
  const rowLength = Math.min(4, randomItems.length);
  const onClickLeft = useCallback(
    () => setPagination((pagination - rowLength + total) % total),
    [pagination, setPagination, rowLength]
  );
  const onClickRight = useCallback(
    () => setPagination((pagination + rowLength + total) % total),
    [pagination, setPagination, rowLength]
  );
  useEffect(() => {
    axios.get(`${API_URL}/request-path`).then((r) => {
      const items = r.data.paths
        .filter((p) => p.state !== "PRIVATE" && p.id !== id)
        .map((p) => ({
          image: `https://roamjs.com/thumbnails/${p.id}.png`,
          title: idToTitle(p.id),
          description: p.description,
          href: `/extensions/${p.id}`,
        }))
        .map((item) => ({ item, r: Math.random() }))
        .sort(({ r: a }, { r: b }) => a - b)
        .map(({ item }) => item);
      setRandomItems(items);
    });
  }, [setRandomItems, id]);
  const onToken = useCallback(
    (token) => {
      const query = new URLSearchParams(window.location.search);
      const state = query.get("state");
      if (state) {
        const [service, otp, key] = state.split("_");
        const auth = AES.encrypt(JSON.stringify({ token }), key).toString();
        axios.post(`${API_URL}/auth`, { service, otp, auth }).then(() => {
          const poll = () =>
            axios.get(`${API_URL}/auth?state=${service}_${otp}`).then((r) => {
              if (r.data.success) {
                window.close();
                setTimeout(
                  () =>
                    window.alert(
                      "You have successfully subscribed to this extension! You may close this window and return to Roam."
                    ),
                  1
                );
              } else {
                setTimeout(poll, 1000);
              }
            });
          poll();
        });
      }
    },
    [setInitialLines, id]
  );
  return (
    <StandardLayout
      title={title}
      description={description}
      img={`https://roamjs.com/thumbnails/${id}.png`}
    >
      <Breadcrumbs
        page={title.toUpperCase()}
        links={[
          {
            text: "EXTENSIONS",
            href: "/extensions",
          },
        ]}
      />
      {development && <H2>UNDER DEVELOPMENT</H2>}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <H1>{title.toUpperCase()}</H1>
        <div style={{ padding: "0 32px", maxWidth: 160 }}>
          <span
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              height: "100%",
            }}
          />
          <img
            src={`https://roamjs.com/thumbnails/${id}.png`}
            style={{
              verticalAlign: "middle",
              width: "100%",
              boxShadow: "0px 3px 14px #00000040",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
      <Subtitle>{description}</Subtitle>
      <hr style={{ marginTop: 28 }} />
      {!!premium && (
        <>
          <H3>Premium Features</H3>
          <div>
            <ServiceButton
              id={id}
              SplashLayout={({ StartNowButton }) => (
                <div>
                  <Body>
                    Some features in this extension require a premium
                    subscription including:
                  </Body>
                  <ul>
                    <li style={{ fontSize: "1rem" }}>{premium.description}</li>
                  </ul>
                  <Body>Click the button below to include these features!</Body>
                  {StartNowButton}
                </div>
              )}
              price={premium.price}
              onToken={onToken}
            />
          </div>
        </>
      )}
      <H3>Installation</H3>
      {!isSafari && (
        <>
          <Body>
            You could use the Copy Extension button below to individually
            install this extension. To install, just paste anywhere in your Roam
            graph and click <b>"Yes, I Know What I'm Doing"</b>.
          </Body>
          <div style={{ marginBottom: 24 }}>
            <Button
              onClick={() => onSave(mainEntry, entry)}
              color="primary"
              variant="contained"
            >
              COPY EXTENSION
            </Button>
            {copied && <span style={{ marginLeft: 24 }}>COPIED!</span>}
          </div>
          <H4>Manual Installation</H4>
          <Body>
            If the extension doesn't work after using the copy extension button
            above, try installing manually using the instructions below.
          </Body>
        </>
      )}
      <Body>
        First create a <b>block</b> with the text{" "}
        <code>{"{{[[roam/js]]}}"}</code> on any page in your Roam DB. Then,
        create a single child of this block type three back ticks. A code block
        should appear. Copy this code and paste it into the child code block in
        your graph:
      </Body>
      <div style={{ marginBottom: 48 }}>
        <Prism language="javascript">
          {entry ? getCodeContent(id, entry) : getSingleCodeContent(mainEntry)}
        </Prism>
      </div>
      <Body>
        Finally, click <b>"Yes, I Know What I'm Doing".</b>
      </Body>
      <hr style={{ marginTop: 40 }} />
      {content.compiledSource ? (
        <MDXRemote {...content} components={MdxComponents} />
      ) : (
        "No content"
      )}
      {legacy && (!development || loom) && !skipDemo && (
        <>
          <H3>Demo</H3>
          {loom ? <Loom id={loom} /> : <DemoVideo src={id} />}
        </>
      )}
      <hr style={{ marginTop: 24 }} />
      <H3>Contributors</H3>
      <Body>
        This extension is brought to you by {author.name}! If you are facing any
        issues reach out to{" "}
        <ExternalLink href={`mailto:${author.email}`}>
          {author.email}
        </ExternalLink>{" "}
        or click on the chat button on the bottom right.
      </Body>
      {!premium && (
        <>
          <Body>
            If you get value from using this extension, consider sponsoring{" "}
            {author.name} by clicking on the button below!
          </Body>
          <SponsorDialog id={id} />
          {!!sponsors?.length && (
            <>
              <Body>
                A special thanks to those who's contributions also helped make
                this extension possible:
              </Body>
              <ThankYou
                sponsors={sponsors}
                defaultImgSrc={"/sponsors/default.jpg"}
              />
            </>
          )}
        </>
      )}
      <SignedOut>
        <div style={{ margin: "128px 0" }}>
          <div style={{ width: "100%", textAlign: "center" }}>
            <RoamJSDigest />
          </div>
        </div>
      </SignedOut>
      <H3>Other Extensions</H3>
      <div
        style={{
          margin: "16px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <IconButton
          icon={"chevronLeft"}
          onClick={onClickLeft}
          style={{ height: 48 }}
        />
        <CardGrid
          items={[
            ...randomItems.slice(pagination, pagination + rowLength),
            ...(pagination + rowLength > total
              ? randomItems.slice(0, pagination + rowLength - total)
              : []),
          ]}
          width={3}
        />
        <IconButton
          icon={"chevronRight"}
          onClick={onClickRight}
          style={{ height: 48 }}
        />
      </div>
    </StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get(`${API_URL}/request-path`)
    .then((r) => ({
      paths: r.data.paths.map(({ id }) => ({
        params: {
          id,
        },
      })),
      fallback: false,
    }))
    .catch(() => ({
      paths: [],
      fallback: false,
    }));

export const getStaticProps: GetStaticProps<
  {
    content: MDXRemoteSerializeResult;
    id: string;
    development: boolean;
  },
  {
    id: string;
    subpath: string;
  }
> = ({ params: { id } }) =>
  axios
    .get(`${API_URL}/request-path?id=${id}`)
    .then(({ data: { content, ...rest } }) => {
      const mdxContent =
        content === "FILE"
          ? fs
              .readFileSync(`pages/docs/extensions/${id}.mdx`)
              .toString()
              .replace(/(.)---\s/s, "$1---\n\n### Usage\n")
          : content;
      return { ...matter(mdxContent), ...rest };
    })
    .then(
      ({
        content: preRender,
        state,
        description,
        data,
        premium = null,
        author,
      }) => {
        const { contributors: contributorsJson } = JSON.parse(
          fs.readFileSync("./thankyou.json").toString()
        );
        console.log(data);
        return serialize(preRender).then((content) => ({
          props: {
            content,
            id,
            development: state === "DEVELOPMENT",
            legacy: state === "LEGACY",
            description,
            sponsors: data.contributors
              ? data.contributors.split(",").map((s: string) => {
                  const parts = s.trim().split(" ");
                  const emojis = parts[parts.length - 1];
                  const emojiKeys = emojis
                    .split("")
                    .map((s, i) => `${s}${emojis.charAt(i + 1)}`)
                    .filter((_, i) => i % 2 === 0)
                    .filter(isThankYouEmoji);
                  const title = parts
                    .slice(
                      0,
                      emojiKeys.length ? parts.length - 1 : parts.length
                    )
                    .join(" ");
                  return {
                    ...contributorsJson[title],
                    title,
                    emojis: emojiKeys,
                  };
                })
              : [],
            ...data,
            premium,
            author,
          },
        }));
      }
    )
    .catch((e) => {
      return serialize(
        `Failed to render due to: ${e.response?.data || e.message}`
      ).then((content) => ({
        props: {
          content,
          id,
          development: true,
        },
      }));
    });

export default ExtensionPage;
