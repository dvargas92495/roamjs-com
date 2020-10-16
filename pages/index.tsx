import React from "react";
import Layout from "../components/Layout";
import RoamJSLogo from "../components/RoamJSLogo";
import { Landing } from "@dvargas92495/ui";

const HomePage = () => (
  <Layout>
    <Landing
      Logo={RoamJSLogo}
      subtitle={"Extensions That Turn You Into A Roam Power User"}
    />
  </Layout>
);

export default HomePage;
