import axios, { AxiosResponse } from "axios";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import React from "react";
import Markdown from "markdown-to-jsx";
import {
  API_URL,
  FLOSS_API_URL,
  QueueItemResponse,
} from "../../../components/constants";
import StandardLayout from "../../../components/StandardLayout";
import { ExternalLink, H2, H4, H5, Items, Subtitle } from "@dvargas92495/ui";
import FundButton from "../../../components/FundButton";

const QueueItemPage = ({
  link,
  title,
  body,
  contracts,
  issueTitle,
}: {
  issueTitle: "extension" | "enhancement",
  link: string;
  title: string;
  body: string;
  contracts: {
    dueDate: string;
    reward: number;
    createdDate: string;
    createdBy: string;
    uuid: string;
  }[];
}) => (
  <StandardLayout>
    <H2>{title}</H2>
    <Subtitle>
      <ExternalLink href={link}>GitHub Link</ExternalLink>
    </Subtitle>
    <H4>Description</H4>
    <div style={{marginBottom: 16}}>
      <Markdown>{body}</Markdown>
    </div>
    <H4>Backers</H4>
    {contracts.length === 0 ? (
      <Subtitle>
        No one has funded this issue. Fund it to move it up the priority queue!
      </Subtitle>
    ) : (
      <Items
        items={contracts.map((c) => ({
          primary: c.createdBy,
          secondary: `Funded $${c.reward} on ${c.createdDate}, expiring on ${c.dueDate}.`,
          key: c.uuid,
        }))}
      />
    )}
    <FundButton title={issueTitle} name={title} url={link} />
  </StandardLayout>
);

const mapIssues = ({
  res,
  issueTitle,
}: {
  res: AxiosResponse<QueueItemResponse[]>;
  issueTitle: "extension" | "enhancement";
}) =>
  res.data.map((i) => ({
    params: {
      number: i.htmlUrl.substring(
        "https://github.com/dvargas92495/roam-js-extensions/issues/".length
      ),
      issueTitle,
    },
  }));

export const getStaticPaths: GetStaticPaths = async () =>
  Promise.all([
    axios.get<QueueItemResponse[]>(`${API_URL}/queue-issues?label=enhancement`),
    axios.get<QueueItemResponse[]>(`${API_URL}/queue-issues?label=extension`),
  ]).then(([enh, ext]) => ({
    paths: [
      ...mapIssues({ res: ext, issueTitle: "extension" }),
      ...mapIssues({ res: enh, issueTitle: "enhancement" }),
    ],
    fallback: false,
  }));

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext<{ number: string, issueTitle: "extension" | "enhancement" }>
) =>
  axios
    .get(
      `${FLOSS_API_URL}/issue?link=dvargas92495/roam-js-extensions/issues/${context.params.number}`
    )
    .then((r) => ({
      props: {...r.data, issueTitle: context.params.issueTitle}
    }));

export default QueueItemPage;
