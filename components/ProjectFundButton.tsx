import { FormDialog, NumberField } from "@dvargas92495/ui";
import React from "react";
import axios, { AxiosRequestConfig } from "axios";
import { API_URL, stripe } from "./constants";
import { useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";

const ProjectFundButtonDialog: React.FunctionComponent<
  ProjectFundButtonProps & {
    apiUrl: string;
    apiOpts?: AxiosRequestConfig;
  }
> = ({ name, uuid, apiUrl, apiOpts = {}, onSuccess, isOpen=false }) => {
  return (
    <FormDialog
      defaultIsOpen={isOpen}
      title={name}
      contentText={`Funding will be held in escrow until completion of the project.`}
      buttonText={"FUND"}
      onSave={({ funding }) =>
        axios
          .post(
            apiUrl.toString(),
            {
              uuid,
              name,
              funding,
            },
            apiOpts
          )
          .then((r) =>
            r.data.active
              ? onSuccess()
              : stripe
                  .then((s) =>
                    s.redirectToCheckout({
                      sessionId: r.data.id,
                    })
                  )
                  .then(() => Promise.resolve())
          )
      }
      formElements={[
        {
          name: "funding",
          defaultValue: 100,
          component: NumberField,
          validate: (v) =>
            v > 0 ? "" : "Funding amount must be greater than 0",
        },
      ]}
    />
  );
};

const SignedInFundButton: React.FunctionComponent<ProjectFundButtonProps> = (
  props
) => {
  const { session } = useClerk();
  const apiUrl = new URL(`${API_URL}/project-fund`);
  apiUrl.searchParams.set("_clerk_session_id", session.id);
  return (
    <ProjectFundButtonDialog
      {...props}
      apiUrl={apiUrl.toString()}
      apiOpts={{
        withCredentials: true,
      }}
    />
  );
};

const SignedOutFundButton: React.FunctionComponent<ProjectFundButtonProps> = (
  props
) => {
  return (
    <ProjectFundButtonDialog {...props} apiUrl={`${API_URL}/project-fund`} />
  );
};

type ProjectFundButtonProps = {
  uuid: string;
  name: string;
  isOpen?: boolean;
  onSuccess: () => Promise<void>;
};

const ProjectFundButton: React.FunctionComponent<ProjectFundButtonProps> = (
  props
) => {
  return (
    <>
      <SignedIn>
        <SignedInFundButton {...props} />
      </SignedIn>
      <SignedOut>
        <SignedOutFundButton {...props} />
      </SignedOut>
    </>
  );
};

export default ProjectFundButton;
