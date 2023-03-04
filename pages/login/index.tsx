import React from "react";
import Layout from "../../components/Layout";

const LoginPage = (): JSX.Element => {
  return (
    <Layout
      title={"Login | RoamJS"}
      description={"Login to RoamJS to get access to subscribed services"}
    >
      <div className="text-center text-xl">
        <div className="my-12">
          We are no longer accepting signups for RoamJS.
        </div>
        <div>
          To become a user of SamePage,{" "}
          <a
            href={"https://samepage.network/signup"}
            className={"text-sky-800"}
          >
            click here!
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
