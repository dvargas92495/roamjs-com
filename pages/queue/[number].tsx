import axios, { AxiosResponse } from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import React, { useCallback, useState } from "react";
import Markdown from "markdown-to-jsx";
import {
  API_URL,
  FLOSS_API_URL,
  QueueItemResponse,
} from "../../components/constants";
import StandardLayout from "../../components/StandardLayout";
import {
  DataLoader,
  ExternalLink,
  H2,
  H4,
  Items,
  Subtitle,
} from "@dvargas92495/ui";
import FundButton from "../../components/FundButton";

const QueueItemPage = ({
  number,
  issueTitle,
}: {
  issueTitle: "extension" | "enhancement";
  number: string;
}): JSX.Element => {
  const [issue, setIssue] = useState<{
    link: string;
    title: string;
    body: string;
    contracts: {
      dueDate: string;
      reward: number;
      createdDate: string;
      createdBy: string;
      createdByName: string;
      uuid: string;
      lifecycle: string;
    }[];
  }>({
    link: "",
    title: "",
    body: "",
    contracts: [],
  });
  const loadAsync = useCallback(
    () =>
      axios
        .get(
          `${FLOSS_API_URL}/issue?link=dvargas92495/roam-js-extensions/issues/${number}`
        )
        .then((r) => setIssue(r.data)),
    [setIssue]
  );
  const activeContracts = issue.contracts.filter(
    (c) => c.lifecycle === "active"
  );
  return (
    <StandardLayout>
      <DataLoader loadAsync={loadAsync}>
        <H2>{issue.title}</H2>
        <Subtitle>
          <ExternalLink href={issue.link}>GitHub Link</ExternalLink>
        </Subtitle>
        <H4>Description</H4>
        <div style={{ marginBottom: 16 }}>
          <Markdown>{issue.body}</Markdown>
        </div>
        <H4>Backers</H4>
        {activeContracts.length === 0 ? (
          <div style={{ marginBottom: 16 }}>
            <Subtitle>
              No one has funded this issue. Fund it to move it up the priority
              queue!
            </Subtitle>
          </div>
        ) : (
          <Items
            items={activeContracts.map((c) => ({
              primary: c.createdByName || c.createdBy,
              secondary: `Funded $${c.reward} on ${c.createdDate}, expiring on ${c.dueDate}.`,
              key: c.uuid,
            }))}
          />
        )}
        <FundButton title={issueTitle} name={issue.title} url={issue.link} />
      </DataLoader>
    </StandardLayout>
  );
};

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

export const getStaticProps: GetStaticProps<
  {
    number: string;
    issueTitle: "extension" | "enhancement";
  },
  {
    number: string;
    issueTitle: "extension" | "enhancement";
  }
> = async (context) => ({
  props: context.params,
});

export default QueueItemPage;
