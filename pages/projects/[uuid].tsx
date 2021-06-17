import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FLOSS_API_URL } from "../../components/constants";
import StandardLayout from "../../components/StandardLayout";
import {
  Button,
  Card,
  DataLoader,
  ExternalLink,
  H1,
  H3,
  H4,
  Items,
  LinearProgress,
  Subtitle,
  Typography,
} from "@dvargas92495/ui";
import { defaultLayoutProps } from "../../components/Layout";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import MdxComponents from "../../components/MdxComponents";
import ProjectFundButton from "../../components/ProjectFundButton";
import { serialize } from "next-mdx-remote/serialize";

type Backer = {
  funding: number;
  backer: string;
  uuid: string;
};

type Props = {
  uuid: string;
  name: string;
  description: string;
  target: number;
  link: string;
  body: MDXRemoteSerializeResult;
  backers: Backer[];
};

const PAGE_SIZE = 8;

const ProjectPage = ({
  uuid,
  name,
  description,
  body,
  link,
  target,
  backers: initialBackers,
}: Props): JSX.Element => {
  const [backers, setBackers] = useState<Backer[]>(initialBackers);
  const [page, setPage] = useState(0);
  const currentBackers = useMemo(
    () => backers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [page, backers]
  );
  const loadAsync = useCallback(
    () =>
      axios
        .get<{ backers: Backer[] }>(
          `${FLOSS_API_URL}/projects?uuid=${uuid}&simple=true`
        )
        .then((r) =>
          setBackers(
            r.data.backers.sort(({ funding: a }, { funding: b }) => b - a)
          )
        ),
    [setBackers, uuid]
  );
  const fundsRaised = useMemo(
    () => backers.reduce((prev, cur) => prev + cur.funding, 0),
    [backers]
  );
  const value = useMemo(
    () => Math.floor((100 * fundsRaised) / target),
    [fundsRaised, target]
  );
  const [isCheckout, setIsCheckout] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const param = query.get("checkout");
    const fund = query.get("fund");
    setIsCheckout(param === "true");
    setIsOpen(fund === "true");
  }, [setIsCheckout, setIsOpen]);
  useEffect(() => {
    if (isCheckout) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.head.appendChild(script);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [isCheckout]);
  return (
    <StandardLayout
      title={name}
      description={description}
      img={defaultLayoutProps.img}
    >
      {isCheckout && (
        <>
          <H3>Thank you for funding!</H3>
          <p>
            To help us reach our funding goal, be sure to share the project on
            Twitter!
          </p>
          <a
            href="https://twitter.com/share?ref_src=twsrc%5Etfw"
            className="twitter-share-button"
            data-size="large"
            data-text={`I just funded the ${name.replace(
              /!/g,
              ""
            )} project on RoamJS!\n\nHelp it reach its funding goal by visiting`}
            data-show-count="false"
            data-url={`https://roamjs.com/projects/${uuid}?fund=true`}
          >
            Tweet
          </a>
        </>
      )}
      <H1>{name}</H1>
      <Subtitle>
        Track progress on the{" "}
        <ExternalLink href={link}>Github Project Page.</ExternalLink>
      </Subtitle>
      <H4>Description</H4>
      <div style={{ marginBottom: 16 }}>
        {body.compiledSource ? (
          <MDXRemote {...body} components={MdxComponents} />
        ) : (
          "No content"
        )}
      </div>
      <Card title={"Funding Progress"}>
        <DataLoader loadAsync={loadAsync}>
          <ProjectFundButton
            name={name}
            uuid={uuid}
            isOpen={isOpen}
            onSuccess={() => loadAsync().then(() => setIsCheckout(true))}
          />
          <hr style={{ marginTop: 16, opacity: 0.3 }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            <LinearProgress
              color={"primary"}
              value={value}
              variant="determinate"
              style={{ flexGrow: 1 }}
            />
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginLeft: 16 }}
            >
              {value}%
            </Typography>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: "50%" }}>
              <div
                style={{
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Funds Raised
                </Typography>
              </div>
              <div
                style={{
                  lineHeight: 1.3,
                  fontWeight: 600,
                  fontSize: "1.75rem",
                  letterSpacing: "-0.015em",
                }}
              >
                ${fundsRaised}
              </div>
            </div>
            <div style={{ width: "50%" }}>
              <div
                style={{
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Funding Goal
                </Typography>
              </div>
              <div
                style={{
                  lineHeight: 1.3,
                  fontWeight: 600,
                  fontSize: "1.75rem",
                  letterSpacing: "-0.015em",
                }}
              >
                ${target}
              </div>
            </div>
          </div>
          <hr style={{ marginTop: 16, opacity: 0.3 }} />
          <H4>Backers</H4>
          {backers.length === 0 ? (
            <div style={{ marginBottom: 16 }}>
              <Subtitle>
                No one has funded this issue. Fund it to help us reach our goal!
              </Subtitle>
            </div>
          ) : (
            <Items
              items={currentBackers.map((c) => ({
                primary: c.backer,
                secondary: `Funded $${c.funding}.`,
                key: c.uuid,
              }))}
            />
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              color={"primary"}
              variant={"contained"}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              color={"primary"}
              variant={"contained"}
              disabled={(page + 1) * PAGE_SIZE >= backers.length}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </DataLoader>
      </Card>
    </StandardLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () =>
  axios
    .get<{ projects: { uuid: string }[] }>(
      `${FLOSS_API_URL}/projects?tenant=${process.env.NEXT_PUBLIC_FLOSS_TENANT}&simple=true`
    )
    .then((res) => ({
      paths: res.data.projects.map((i) => ({
        params: {
          uuid: i.uuid,
        },
      })),
      fallback: false,
    }));

export const getStaticProps: GetStaticProps<
  Props,
  {
    uuid: string;
  }
> = async (context) =>
  axios
    .get<{ body: string } & Omit<Props, "body">>(
      `${FLOSS_API_URL}/projects?uuid=${context.params.uuid}`
    )
    .then(({ data: { body, ...rest } }) =>
      serialize(body).then((body) => ({
        props: {
          body,
          ...rest,
        },
      }))
    );

export default ProjectPage;
