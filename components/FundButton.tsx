import {
  DateField,
  FormDialog,
  NumberField,
  StringField,
} from "@dvargas92495/ui";
import React from "react";
import axios from "axios";
import { FLOSS_API_URL } from "./constants";
import format from "date-fns/format";
import { loadStripe } from "@stripe/stripe-js";
import addMonths from "date-fns/addMonths";
import isBefore from "date-fns/isBefore";
// import { useClerk } from "@clerk/clerk-react";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const FundButton: React.FunctionComponent<{
  title: string;
  name: string;
  url: string;
}> = ({ title, name, url }) => {
  //const { session } = useClerk();
  const session = undefined;
  const user = undefined;
  const apiUrl = new URL(`${FLOSS_API_URL}/stripe-session`);
  if (session) {
    apiUrl.searchParams.set("_clerk_session_id", session.id);
  }
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
              mode: "setup",
            },
            {
              headers: {
                Authorization: session
                  ? ""
                  : `Basic ${btoa(body.email)}`,
              },
            }
          )
          .then((r) =>
            stripe.then((s) =>
              s.redirectToCheckout({
                sessionId: r.data.id,
              })
            )
          )
      }
      formElements={[
        {
          name: "funding",
          defaultValue: 50,
          component: NumberField,
          validate: (v: number) =>
            v > 0 ? "" : "Funding amount must be greater than 0",
        },
        {
          name: "due",
          defaultValue: addMonths(new Date(), 1),
          component: DateField,
          validate: (v: Date) =>
            !isBefore(new Date(), v) ? "Due Date must be after today" : "",
        },
        ...(user
          ? []
          : [
              {
                name: "email",
                defaultValue: "",
                component: StringField,
                validate: (v: string) =>
                  v.indexOf("@") > -1
                    ? ""
                    : "Please enter a valid email address",
              },
            ]),
      ]}
    />
  );
};

export default FundButton;
