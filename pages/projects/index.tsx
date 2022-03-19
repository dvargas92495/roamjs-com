import React, { ReactElement, useEffect, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import { defaultLayoutProps } from "../../components/Layout";

const ProjectsPage = (): ReactElement => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    } else if (!Array.from(document.getElementsByTagName('script')).some(s => s.src.includes('workinpublic'))) {
      const script = document.createElement('script');
      script.src = "https://workinpublic.io/board/84cc166b-9f98-4640-a2cb-6db8b28bfe0d.js"
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
      {mounted && (
          <div id="84cc166b-9f98-4640-a2cb-6db8b28bfe0d"></div>
          
      )}
    </StandardLayout>
  );
};

export default ProjectsPage;
