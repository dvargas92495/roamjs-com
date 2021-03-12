import {
  Button,
  Card,
  InputGroup,
  Intent,
  Label,
  Popover,
  Spinner,
} from "@blueprintjs/core";
import axios from "axios";
import format from "date-fns/format";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  getPageUidByPageTitle,
  openBlockInSidebar,
  setInputSetting,
} from "../entry-helpers";
import { useSocialToken } from "./hooks";

type AttemptedTweet = {
  status: "FAILED" | "SUCCESS";
  message: string;
};

type PendingTweet = {
  status: "PENDING";
};

type ScheduledTweet = {
  uuid: string;
  blockUid: string;
  createdDate: string;
  scheduledDate: string;
} & (AttemptedTweet | PendingTweet);

const SUPPORTED_CHANNELS = ["twitter"];

const RequestTokenContent = ({
  setToken,
}: {
  setToken: (t: string) => void;
}) => {
  const [value, setValue] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue]
  );
  const onSubmit = useCallback(() => {
    const pageUid = getPageUidByPageTitle("roam/js/social");
    setInputSetting({ blockUid: pageUid, key: "token", value });
    setToken(value);
  }, [value]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        onSubmit();
      }
    },
    [onSubmit]
  );
  return (
    <>
      <p>Paste in your token from RoamJS below</p>
      <Label>
        RoamJS Social Token
        <InputGroup value={value} onChange={onChange} onKeyDown={onKeyDown} />
      </Label>
      <Button onClick={onSubmit} intent={Intent.PRIMARY}>
        NEXT
      </Button>
    </>
  );
};

const ScheduledContent: React.FC<{ socialToken: string }> = ({
  socialToken,
}) => {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([]);
  const refresh = useCallback(() => {
    setLoading(true);
    axios
      .get(`${process.env.REST_API_URL}/twitter-schedule`, {
        headers: { Authorization: `social:${socialToken}` },
      })
      .then((r) => {
        setValid(true);
        setScheduledTweets(r.data.scheduledTweets);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setValid, socialToken]);
  useEffect(() => {
    if (loading) {
      refresh();
    }
  }, [loading, refresh]);
  return loading ? (
    <Spinner />
  ) : valid ? (
    <>
      <h4>Scheduled Content</h4>
      {scheduledTweets.length ? (
        <table className="bp3-html-table bp3-html-table-bordered bp3-html-table-striped">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Block</th>
              <th>Created Date</th>
              <th>Scheduled Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {scheduledTweets.map(
              ({
                uuid,
                blockUid,
                scheduledDate,
                createdDate,
                ...statusProps
              }) => {
                return (
                  <tr key={uuid}>
                    <td>Twitter</td>
                    <td>
                      <span
                        className="rm-block-ref"
                        onClick={() => openBlockInSidebar(blockUid)}
                      >
                        <span>(({blockUid}))</span>
                      </span>
                    </td>
                    <td>
                      {format(new Date(createdDate), "yyyy/MM/dd hh:mm a")}
                    </td>
                    <td>
                      {format(new Date(scheduledDate), "yyyy/MM/dd hh:mm a")}
                    </td>
                    <td>
                      {statusProps.status === "SUCCESS" && (
                        <a
                          href={statusProps.message}
                          target="_blank"
                          rel="noopener"
                          style={{ color: "darkgreen" }}
                        >
                          SUCCESS
                        </a>
                      )}
                      {statusProps.status === "PENDING" && (
                        <span style={{ color: "darkgoldenrod" }}>PENDING</span>
                      )}
                      {statusProps.status === "FAILED" && (
                        <Popover
                          content={
                            <span
                              style={{
                                color: "darkred",
                                cursor: "pointer",
                              }}
                            >
                              {statusProps.message}
                            </span>
                          }
                          target={
                            <span
                              style={{
                                color: "darkred",
                                cursor: "pointer",
                              }}
                            >
                              FAILED
                            </span>
                          }
                        />
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      ) : (
        <>
          <div style={{ color: "darkgoldenrod" }}>
            You have not scheduled any content from Roam! You could use this
            service with the following extensions:
          </div>
          {SUPPORTED_CHANNELS.map((c) => (
            <Card style={{ width: "50%" }}>
              <h5>{c.toUpperCase()}</h5>
              <ol>
                <li>
                  Type <code>tweet</code> into a block
                </li>
                <li>Nest your content as a child block</li>
                <li>Click the Twitter icon and click Schedule Tweet</li>
              </ol>
            </Card>
          ))}
        </>
      )}
    </>
  ) : (
    <div style={{ color: "darkred" }}>
      <h4>RoamJS Social Token {socialToken} is invalid.</h4>
      <p>
        If you are subscribed to RoamJS Social, you can find your RoamJS token
        on the{" "}
        <a
          href={"https://roamjs.com/user?tab=social"}
          target="_blank"
          rel="noopener"
        >
          Social tab of your user page.
        </a>{" "}
        Then add it to your [[roam/js/social]] page nested under a block that
        says 'token'.
      </p>
      <p>
        If you aren't a RoamJS Social subscriber, find out more{" "}
        <a
          href={"https://roamjs.com/services/social"}
          target="_blank"
          rel="noopener"
        >
          in our docs!
        </a>
      </p>
      <p>
        If you are sure this token is correct, please reach out to
        support@roamjs.com for help!
      </p>
    </div>
  );
};

const SocialDashboard: React.FC = () => {
  const socialToken = useSocialToken();
  const [token, setToken] = useState(socialToken);
  return (
    <Card>
      {token ? (
        <ScheduledContent socialToken={token} />
      ) : (
        <RequestTokenContent setToken={setToken} />
      )}
    </Card>
  );
};

export const render = (p: HTMLDivElement): void =>
  ReactDOM.render(<SocialDashboard />, p);

export default SocialDashboard;
