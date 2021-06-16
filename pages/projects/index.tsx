import { Queue, StringField } from "@dvargas92495/ui";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import axios from "axios";
import { FLOSS_API_URL } from "../../components/constants";
import { defaultLayoutProps } from "../../components/Layout";
import ProjectFundButton from "../../components/ProjectFundButton";

type ProjectResponse = {
  progress: number;
  target: number;
  name: string;
  uuid: string;
};

const ProjectsPage = (): JSX.Element => {
  const [search, setSearch] = useState("");
  const loadItems = useCallback(
    () =>
      axios
        .get(
          `${FLOSS_API_URL}/projects?tenant=${process.env.NEXT_PUBLIC_FLOSS_TENANT}`
        )
        .then((r) => r.data.projects || []),
    []
  );
  const mapper = useCallback(
    (item: ProjectResponse) => ({
      avatar: (
        <div style={{ minWidth: 100 }}>
          {Math.floor((item.progress / item.target) * 100)}% Funded
        </div>
      ),
      primary: item.name,
      secondary: (
        <span>
          <Link href={`projects/${item.uuid}`}>Details</Link>
        </span>
      ),
      action: (
        <ProjectFundButton
          uuid={item.uuid}
          name={item.name}
          onSuccess={() =>
            Promise.resolve(
              window.location.assign(`/projects/${item.uuid}?checkout=true`)
            )
          }
        />
      ),
      key: item.uuid,
    }),
    []
  );
  const filter = useCallback(
    (item) =>
      !search || item.primary.toLowerCase().indexOf(search.toLowerCase()) > -1,
    [search]
  );
  return (
    <StandardLayout
      title={"Projects | RoamJS"}
      description={
        "Check out what's coming to RoamJS and fund whichever project you're most excited about!"
      }
      img={defaultLayoutProps.img}
    >
      <div style={{ marginBottom: 16, padding: "0 16px" }}>
        <StringField
          value={search}
          setValue={setSearch}
          label={"Search"}
          fullWidth
        />
      </div>
      <div style={{ padding: 8, width: "100%", height: 512 }}>
        <Queue
          title={"Projects"}
          loadItems={loadItems}
          mapper={mapper}
          filter={filter}
          subheader={"Fund a project to help it reach its funding goal!"}
        />
      </div>
    </StandardLayout>
  );
};

export default ProjectsPage;
