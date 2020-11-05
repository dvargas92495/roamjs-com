import { Body, Button, H1, Queue } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import Layout from "../../components/Layout";
import axios from "axios";

export const API_URL = `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production`;

type QueueItemResponse = {
  total: number;
  name: string;
  description: string;
};

const FundButton = () => {
  const [clicked, setClicked] = useState(false);
  return (
    <>
      <div>
        <Button
          color={"primary"}
          variant={"contained"}
          onClick={() => setClicked(!clicked)}
        >
          FUND
        </Button>
      </div>
      {clicked && "Coming Soon!"}
    </>
  );
};

const QueueItems = ({ title, path }: { title: string; path: string }) => {
  const loadItems = useCallback(
    () =>
      axios.get(`${API_URL}/${path}`).then((r) =>
        r.data.map((item: QueueItemResponse) => ({
          avatar: <div>${item.total}</div>,
          primary: item.name,
          secondary: item.description,
          action: <FundButton />,
        }))
      ),
    []
  );
  return (
    <div style={{ padding: 8, maxWidth: 380 }}>
      <Queue title={title} loadItems={loadItems} />
    </div>
  );
};

const QueuePage = () => {
  return (
    <Layout>
      <div style={{ maxWidth: 760 }}>
        <H1>Queue</H1>
        <Body>
          This page contains all the new extensions and enhancements coming to
          RoamJS. Directly sponsor one to prioritize it higher in the queue!
        </Body>
        <div style={{ display: "flex", maxHeight: 600 }}>
          <QueueItems title={"Extensions"} path={"queue-projects"} />
          <QueueItems title={"Enhancements"} path={"queue-issues"} />
        </div>
      </div>
    </Layout>
  );
};

export default QueuePage;
