import { DateField, FormDialog, NumberField } from "@dvargas92495/ui";
import React from "react";
import axios, { AxiosRequestConfig } from "axios";
import { API_URL, FLOSS_API_URL, stripe } from "./constants";
import format from "date-fns/format";
import addMonths from "date-fns/addMonths";
import isBefore from "date-fns/isBefore";
import { useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";

const FundButtonDialog: React.FunctionComponent<
  FundButtonProps & {
    apiUrl: string;
    apiOpts?: AxiosRequestConfig;
  }
> = ({ title, name, url, apiUrl, apiOpts = {}, onSuccess }) => {
  return (
    <FormDialog
      title={name}
      contentText={`Funding will be charged upon completion of ${title}.`}
      buttonText={"FUND"}
      onSave={(body) =>
        axios
          .post(
            apiUrl.toString(),
            {
              link: url,
              reward: body.funding,
              dueDate: format(body.due, "yyyy-MM-dd"),
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
          defaultValue: 50,
          component: NumberField,
          validate: (v) =>
            v > 0 ? "" : "Funding amount must be greater than 0",
        },
        {
          name: "due",
          defaultValue: addMonths(new Date(), 6),
          component: DateField,
          validate: (v) =>
            !isBefore(new Date(), v as Date)
              ? "Due Date must be after today"
              : "",
        },
      ]}
    />
  );
};

const SignedInFundButton: React.FunctionComponent<FundButtonProps> = (
  props
) => {
  const { session } = useClerk();
  const apiUrl = new URL(`${API_URL}/fund`);
  apiUrl.searchParams.set("_clerk_session_id", session.id);
  return (
    <FundButtonDialog
      {...props}
      apiUrl={apiUrl.toString()}
      apiOpts={{
        withCredentials: true,
      }}
    />
  );
};

const SignedOutFundButton: React.FunctionComponent<FundButtonProps> = (
  props
) => {
  return (
    <FundButtonDialog
      {...props}
      apiUrl={`${FLOSS_API_URL}/stripe-setup-intent`}
    />
  );
};

type FundButtonProps = {
  title: string;
  name: string;
  url: string;
  onSuccess: () => Promise<void>;
};

const FundButton: React.FunctionComponent<FundButtonProps> = (props) => {
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

export default FundButton;
