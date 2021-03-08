import { Card, Popover, Spinner } from "@blueprintjs/core";
import axios from "axios";
import format from "date-fns/format";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { openBlockInSidebar } from "../entry-helpers";
import EditContainer from "./EditContainer";
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

const TwitterDashboard: React.FC<{ blockId: string }> = ({ blockId }) => {
  const socialToken = useSocialToken();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([]);
  const refresh = useCallback(() => {
    setLoading(true);
    axios
      .get(`${process.env.REST_API_URL}/twitter-schedule`, {
        headers: { Authorization: socialToken },
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
  return (
    <EditContainer blockId={blockId} refresh={refresh}>
      <Card>
        {loading ? (
          <Spinner />
        ) : valid ? (
          <>
            <h4>Scheduled Tweets</h4>
            {scheduledTweets.length ? (
              <table className="bp3-html-table bp3-html-table-bordered bp3-html-table-striped">
                <thead>
                  <tr>
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
                          <td>
                            <span
                              className="rm-block-ref"
                              onClick={() => openBlockInSidebar(blockUid)
                              }
                            >
                              <span>(({blockUid}))</span>
                            </span>
                          </td>
                          <td>
                            {format(
                              new Date(createdDate),
                              "yyyy/MM/dd hh:mm a"
                            )}
                          </td>
                          <td>
                            {format(
                              new Date(scheduledDate),
                              "yyyy/MM/dd hh:mm a"
                            )}
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
                              <span style={{ color: "darkgoldenrod" }}>
                                PENDING
                              </span>
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
              <div style={{ color: "darkgoldenrod" }}>
                You have not scheduled any tweets from Roam!
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "darkred" }}>
            <h4>RoamJS Social Token {socialToken} is invalid.</h4>
            <p>
              If you are subscribed to RoamJS Social, you can find your RoamJS
              token on the{" "}
              <a
                href={"https://roamjs.com/user?tab=social"}
                target="_blank"
                rel="noopener"
              >
                Social tab of your user page.
              </a>{" "}
              Then add it to your [[roam/js/social]] page nested under a block
              that says 'token'.
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
        )}
      </Card>
    </EditContainer>
  );
};

export const render = (p: HTMLButtonElement): void =>
  ReactDOM.render(
    <TwitterDashboard blockId={p.closest(".roam-block").id} />,
    p.parentElement
  );

export default TwitterDashboard;
