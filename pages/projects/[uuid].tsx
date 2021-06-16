import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React, { useCallback, useMemo, useState } from "react";
import { FLOSS_API_URL } from "../../components/constants";
import StandardLayout from "../../components/StandardLayout";
import {
  Card,
  DataLoader,
  H1,
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
  createdBy: string;
  uuid: string;
};

type Props = {
  uuid: string;
  name: string;
  description: string;
  target: number;
  body: MDXRemoteSerializeResult;
  backers: Backer[];
};

const ProjectPage = ({
  uuid,
  name,
  description,
  body,
  target,
  backers: initialBackers,
}: Props): JSX.Element => {
  const [backers, setBackers] = useState<Backer[]>(initialBackers);
  const loadAsync = useCallback(
    () =>
      axios
        .get(`${FLOSS_API_URL}/projects?uuid=${uuid}&simple=true`)
        .then((r) => setBackers(r.data.backers)),
    [setBackers, uuid]
  );
  const fundsRaised = useMemo(
    () => backers.reduce((prev, cur) => prev + cur.funding, 0),
    [backers]
  );
  const value = useMemo(
    () => Math.ceil((100 * fundsRaised) / target),
    [fundsRaised, target]
  );
  return (
    <StandardLayout
      title={name}
      description={description}
      img={defaultLayoutProps.img}
    >
      <H1>{name}</H1>
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
          <ProjectFundButton name={name} uuid={uuid} onSuccess={loadAsync} />
          <hr style={{ marginTop: 16 }} />
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
          <hr style={{ marginTop: 16 }} />
          <H4>Backers</H4>
          {backers.length === 0 ? (
            <div style={{ marginBottom: 16 }}>
              <Subtitle>
                No one has funded this issue. Fund it to move it up the priority
                queue!
              </Subtitle>
            </div>
          ) : (
            <Items
              items={backers.map((c) => ({
                primary: c.createdBy,
                secondary: `Funded $${c.funding}.`,
                key: c.uuid,
              }))}
            />
          )}
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
