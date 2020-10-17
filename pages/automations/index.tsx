import React from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

const AutomationsPage = () => (
  <Layout>
    <h1>
      Automations - <i>Coming Soon</i>
    </h1>
    <p>
      Once Roam's new backend API is live, you will be able to use this page to
      configure automations. Until then, this page will serve as a sneak peak as
      to what's coming!
    </p>
    <ul>
      <li>
        <Link href={"/automations/template-daily-note"}>
          Template Daily Notes
        </Link>
      </li>
    </ul>
  </Layout>
);

export default AutomationsPage;
