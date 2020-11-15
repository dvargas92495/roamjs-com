import {
  Body,
  H1,
  Queue,
  FormDialog,
  NumberField,
  DateField,
  ExternalLink,
  StringField,
} from "@dvargas92495/ui";
import React, { useCallback } from "react";
import StandardLayout from "../../components/StandardLayout";
import axios from "axios";
import { useUser } from "react-manage-users";
import addMonths from "date-fns/addMonths";
import isBefore from "date-fns/isBefore";
import format from "date-fns/format";
import { loadStripe } from "@stripe/stripe-js";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

export const API_URL = `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production`;
export const FLOSS_API_URL = process.env.NEXT_PUBLIC_FLOSS_API_URL;

type QueueItemResponse = {
  total: number;
  name: string;
  description: string;
  htmlUrl: string;
};

const toLabel = (title: string) =>
  title.toLowerCase().substring(0, title.length - 1);

const FundButton = ({
  title,
  name,
  url,
}: {
  title: string;
  name: string;
  url: string;
}) => {
  const user = useUser();
  return (
    <FormDialog
      title={name}
      contentText={`WARNING: Still Testing. Funding will be charged upon completion of ${toLabel(
        title
      )}.`}
      buttonText={"FUND"}
      onSuccess={() => {}}
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
                Authorization: !!user
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
        ...(!!user
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

const QueueItems = ({ title }: { title: string }) => {
  const loadItems = useCallback(
    () =>
      axios.get(`${API_URL}/queue-issues?label=${toLabel(title)}`).then((r) =>
        (r.data || []).map((item: QueueItemResponse) => ({
          avatar: <div>${item.total}</div>,
          primary: item.name,
          secondary: (
            <ExternalLink href={item.htmlUrl}>
              {title.substring(0, title.length - 1)} Link
            </ExternalLink>
          ),
          action: (
            <FundButton title={title} name={item.name} url={item.htmlUrl} />
          ),
        }))
      ),
    [title]
  );
  return (
    <div style={{ padding: 8, width: "50%" }}>
      <Queue title={title} loadItems={loadItems} />
    </div>
  );
};

const QueuePage = () => {
  return (
    <StandardLayout>
      <H1>Queue</H1>
      <Body>
        This page contains all the new extensions and enhancements coming to
        RoamJS. Directly sponsor one to prioritize it higher in the queue!
      </Body>
      <div style={{ display: "flex", maxHeight: 600 }}>
        <QueueItems title={"Extensions"} />
        <QueueItems title={"Enhancements"} />
      </div>
    </StandardLayout>
  );
};

export default QueuePage;
