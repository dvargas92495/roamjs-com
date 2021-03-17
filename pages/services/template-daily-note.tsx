import React from "react";
import ServiceLayout, {
  getStaticPropsForPage,
  ServicePageProps,
} from "../../components/ServiceLayout";

const TemplateDailyNotePage: React.FC<ServicePageProps> = (props) => {
  return (
    <ServiceLayout development {...props}>
      The Template Daily Note Automation will automatically update each day's
      daily note with your predefined template. You can define this template in
      the \`[[roam/js/template-daily-note]]\` page.
    </ServiceLayout>
  );
};

export const getStaticProps = getStaticPropsForPage("template-daily-note");

export default TemplateDailyNotePage;
