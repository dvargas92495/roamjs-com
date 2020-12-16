import {
  DateField,
  FormDialog,
  NumberField,
  StringField,
} from "@dvargas92495/ui";
import React from "react";
import { useUser } from "react-manage-users";
import axios from "axios";
import { FLOSS_API_URL } from "./constants";
import format from "date-fns/format";
import { loadStripe } from "@stripe/stripe-js";
import addMonths from "date-fns/addMonths";
import isBefore from "date-fns/isBefore";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const FundButton: React.FunctionComponent<{
  title: string;
  name: string;
  url: string;
}> = ({ title, name, url }) => {
  const user = useUser();
  return (
    <FormDialog
      title={name}
      contentText={`Funding will be charged upon completion of ${title}.`}
      buttonText={"FUND"}
      onSave={(body) =>
        axios
          .post(
            `${FLOSS_API_URL}/stripe-session`,
            {
              link: url,
              reward: body.funding,
              dueDate: format(body.due, "yyyy-MM-dd"),
              mode: "setup",
            },
            {
              headers: {
                Authorization: user
                  ? `token ${user.accessToken}`
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
