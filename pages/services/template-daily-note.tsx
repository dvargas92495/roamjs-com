import React from "react";
import ServiceLayout from "../../components/ServiceLayout";
import {
  getStaticPropsForPage,
  ServicePageProps,
} from "../../components/ServicePageCommon";

const TemplateDailyNotePage: React.FC<ServicePageProps> = (props) => {
  return (
    <ServiceLayout
      development
      {...props}
      overview={`The Template Daily Note Automation will automatically update each day's
daily note with your predefined template. You can define this template
in the \`[[roam/js/template-daily-note]]\` page.`}
    >
      Coming Soon...
    </ServiceLayout>
  );
};

export const getStaticProps = getStaticPropsForPage("template-daily-note");

export default TemplateDailyNotePage;
