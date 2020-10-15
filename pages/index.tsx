import React from "react";
import Layout from "../components/Layout";
import RoamJSLogo from "../components/RoamJSLogo";

const HomePage = () => (
  <Layout>
    <h1>
      <RoamJSLogo size={20} />
    </h1>
    <h4>
      <i>Extensions That Turn You Into A Roam Power User</i>
    </h4>
  </Layout>
);

export default HomePage;
