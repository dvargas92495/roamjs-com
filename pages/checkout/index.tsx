import StandardLayout from "../../components/StandardLayout";
import React, { useEffect, useState } from "react";
import { H4 } from "@dvargas92495/ui";

const Dashboard = () => {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage(
        "Project Funded! If you head to the Queue page, you should see the project at higher priority!"
      );
    }
    if (query.get("cancel")) {
      setMessage("Funding Cancelled");
    }
  }, [setMessage]);
  return (
    <StandardLayout>
      <H4>{message}</H4>
    </StandardLayout>
  );
};

export default Dashboard;
