import React from "react";
import ServiceLayout, {
  getStaticPropsForPage,
  ServicePageProps,
} from "../../components/ServiceLayout";

const DeveloperPage: React.FC<ServicePageProps> = (props) => {
  return (
    <ServiceLayout development {...props}>
      The Developer Service allows other developers to host extensions and
      services on RoamJS! Extensions can be hosted for free. RoamJS will charge
      5% of each subscription for services.
    </ServiceLayout>
  );
};

export const getStaticProps = getStaticPropsForPage("developer");

export default DeveloperPage;
