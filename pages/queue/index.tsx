import { Body, H1 } from "@dvargas92495/ui";
import React from "react";
import Layout from "../../components/Layout";

const QueuePage = () => (
  <Layout>
    <div style={{ maxWidth: 640 }}>
      <H1>Queue</H1>
      <Body>
        This page contains all new extensions and enhancements coming to RoamJS.
        Directly sponsor one to prioritize it higher in the queue!
      </Body>
    </div>
  </Layout>
);

export default QueuePage;
