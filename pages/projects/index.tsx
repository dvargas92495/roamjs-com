import React, { ReactElement, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { defaultLayoutProps } from "../../components/Layout";

const ProjectsPage = (): ReactElement => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    } else if (
      !Array.from(document.getElementsByTagName("script")).some((s) =>
        s.src.includes("workinpublic")
      )
    ) {
      const script = document.createElement("script");
      script.src =
        "https://workinpublic.io/board/84cc166b-9f98-4640-a2cb-6db8b28bfe0d.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [mounted, setMounted]);
  return (
    <StandardLayout
      title={"Projects | RoamJS"}
      description={
        "Check out what's coming to RoamJS and fund whichever project you're most excited about!"
      }
      img={defaultLayoutProps.img}
    >
      <h2 style={{ textAlign: "center" }}>
        This Page Is Under Construction. Come Back Soon!
      </h2>
      <div
        id="84cc166b-9f98-4640-a2cb-6db8b28bfe0d"
        key="84cc166b-9f98-4640-a2cb-6db8b28bfe0d"
        style={{ minHeight: 652 }}
      ></div>
      <h2 id="freelancing">Freelancing</h2>
      <p>
        Have a personal feature request? Or would like company's product to
        integrate with Roam? Reach out in the widget on the bottom right or
        <a
          href="https://calendly.com/dvargas92495/roamjs"
          rel="noopener"
          target={"_blank"}
        >
          book a call
        </a>{" "}
        to inquire about working together on the project
      </p>
      <p>
        We operate on a milestone basis at $2,000/milestone. As our client, we
        would work together to agree upon milestones ahead of time which we size
        at about 4 hours of work, but they often take longer. Bug fixes that
        come up during and after the project are free.
      </p>
    </StandardLayout>
  );
};

export default ProjectsPage;
