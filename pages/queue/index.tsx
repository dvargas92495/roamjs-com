import { Body, H1, Queue, StringField } from "@dvargas92495/ui";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import axios from "axios";
import { API_URL, QueueItemResponse } from "../../components/constants";
import FundButton from "../../components/FundButton";

const toLabel = (title: string) =>
  title.toLowerCase().substring(0, title.length - 1);

const QueueItems = ({
  title,
  search,
  description,
}: {
  title: string;
  search: string;
  description: string;
}) => {
  const loadItems = useCallback(
    () =>
      axios.get(`${API_URL}/queue-issues?label=${toLabel(title)}`).then((r) =>
        (r.data || []).map((item: QueueItemResponse) => ({
          avatar: <div>${item.total}</div>,
          primary: item.name,
          secondary: (
            <Link
              href={`queue/${toLabel(title)}/${item.htmlUrl.substring(
                "https://github.com/dvargas92495/roam-js-extensions/issues/"
                  .length
              )}`}
            >
              Details
            </Link>
          ),
          action: (
            <FundButton
              title={toLabel(title)}
              name={item.name}
              url={item.htmlUrl}
            />
          ),
        }))
      ),
    [title]
  );
  const filter = useCallback(
    (item) =>
      !search || item.primary.toLowerCase().indexOf(search.toLowerCase()) > -1,
    [search]
  );
  return (
    <div style={{ padding: 8, width: "50%" }}>
      <Queue
        title={title}
        loadItems={loadItems}
        filter={filter}
        subheader={description}
      />
    </div>
  );
};

const QueuePage = (): JSX.Element => {
  const [search, setSearch] = useState("");
  return (
    <StandardLayout>
      <H1>Queue</H1>
      <Body>
        This page contains all the new extensions and enhancements coming to
        RoamJS. Directly sponsor one to prioritize it higher in the queue!
      </Body>
      <div style={{ marginBottom: 16, padding: "0 16px" }}>
        <StringField
          value={search}
          setValue={setSearch}
          label={"Search"}
          fullWidth
        />
      </div>
      <div style={{ display: "flex", maxHeight: 600, height: 600 }}>
        <QueueItems
          title={"Extensions"}
          search={search}
          description={"New releases"}
        />
        <QueueItems
          title={"Enhancements"}
          search={search}
          description={"Improvements to existing extensions"}
        />
      </div>
    </StandardLayout>
  );
};

export default QueuePage;
