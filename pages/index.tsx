import React from "react";
import RoamJSLogo from "../components/RoamJSLogo";
import { Landing } from "@dvargas92495/ui";
import StandardLayout from "../components/StandardLayout";

const HomePage = () => (
  <StandardLayout>
    <Landing
      Logo={RoamJSLogo}
      subtitle={"Extensions That Turn You Into A Roam Power User"}
    />
  </StandardLayout>
);

export default HomePage;
