import { Queue, StringField } from "@dvargas92495/ui";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import axios from "axios";
import { API_URL, QueueItemResponse } from "../../components/constants";
import FundButton from "../../components/FundButton";

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
      axios.get(`${API_URL}/queue-issues`).then((r) =>
        (r.data || []).map((item: QueueItemResponse) => ({
          avatar: <div>${item.total}</div>,
          primary: item.name,
          secondary: (
            <span>
              <Link
                href={`queue/${item.htmlUrl.substring(
                  "https://github.com/dvargas92495/roam-js-extensions/issues/"
                    .length
                )}`}
              >
                {`${item.label.substring(0, 1).toUpperCase()}${item.label.substring(1)} Details`}
              </Link>
            </span>
          ),
          action: (
            <FundButton
              title={item.label}
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
    <div style={{ padding: 8, width: "100%", height: 512, marginBottom: 64 }}>
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
      <div style={{ marginBottom: 16, padding: "0 16px" }}>
        <StringField
          value={search}
          setValue={setSearch}
          label={"Search"}
          fullWidth
        />
      </div>
      <QueueItems
        title={"Queue"}
        search={search}
        description={
          "All the new extensions and enhancements coming to RoamJS. Fund one to move it up the Queue!"
        }
      />
    </StandardLayout>
  );
};

export default QueuePage;
