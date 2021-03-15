import {
  Alert,
  Button,
  Card,
  Popover,
  Position,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import format from "date-fns/format";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { createBlock, getTreeByPageName, watchOnce } from "roam-client";
import {
  getChildrenLengthByPageTitle,
  getPageUidByPageTitle,
  openBlockInSidebar,
} from "../entry-helpers";
import {
  HIGHLIGHT,
  ServiceDashboard,
  StageContent,
  TOKEN_STAGE,
  useAuthenticatedAxiosDelete,
  useAuthenticatedAxiosGet,
  usePageUid,
} from "./ServiceCommonComponents";
import { render as loginRender } from "../components/TwitterLogin";

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
const codeBlockText = `\`\`\`javascript
var existing = document.getElementById("roamjs-twitter");
if (!existing) {
  var extension = document.createElement("script");
  extension.src = "https://roamjs.com/twitter.js";
  extension.id = "roamjs-twitter";
  extension.async = true;
  extension.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(extension);
}
\`\`\``;

const renderTooltip = ({
  tooltipMessage,
  portalContainer,
}: {
  tooltipMessage: string;
  portalContainer: HTMLSpanElement;
}) =>
  ReactDOM.render(
    <Tooltip
      isOpen={true}
      position={Position.LEFT}
      content={
        <span style={{ width: 128, display: "inline-block" }}>
          {tooltipMessage}
        </span>
      }
    >
      <span
        style={{
          display: "inline-block",
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: "none",
        }}
      />
    </Tooltip>,
    portalContainer
  );

const getBulletElement = (uid: string) => {
  const block = Array.from(
    document.getElementsByClassName("roam-block")
  ).find((d) => d.id.endsWith(uid));
  return {
    block,
    bullet: block.parentElement.getElementsByClassName(
      "rm-bullet"
    )[0] as HTMLSpanElement,
  };
};

const isTwitterOauthSet = () =>
  getTreeByPageName("roam/js/twitter").some((t) => /oauth/i.test(t.text));

const TwitterTutorial = ({ pageUid }: { pageUid: string }) => {
  const [alertMessage, setAlertMessage] = useState("");
  const onClose = useCallback(() => setAlertMessage(""), [setAlertMessage]);
  const alertCallback = useRef(() => console.log("No Alert Callback Set"));
  const stepThree = useCallback(() => {
    alertCallback.current = () => {
      const length = getChildrenLengthByPageTitle("roam/js/social");
      const uid = window.roamAlphaAPI.util.generateUID();
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": pageUid, order: length },
        block: { uid, string: "" },
      });
      setTimeout(() => {
        const portalContainer = document.createElement("span");
        portalContainer.id = "roamjs-social-guide";
        const { block, bullet: parent } = getBulletElement(uid);
        parent.appendChild(portalContainer);
        renderTooltip({
          portalContainer,
          tooltipMessage: "First, type {{[[tweet]]}} into this block",
        });
        watchOnce("[:block/string]", `[:block/uid "${uid}"]`, (_, after) => {
          if (/{{(?:\[\[)?tweet(?:\]\])}}/i.test(after[":block/string"])) {
            const childUid = window.roamAlphaAPI.util.generateUID();
            window.roamAlphaAPI.createBlock({
              location: { "parent-uid": uid, order: 0 },
              block: { string: "", uid: childUid },
            });
            setTimeout(() => {
              const { bullet: child } = getBulletElement(childUid);
              child.appendChild(portalContainer);
              ReactDOM.unmountComponentAtNode(portalContainer);
              renderTooltip({
                portalContainer,
                tooltipMessage: "Now, write out your tweet as a child block.",
              });
              setTimeout(() => {
                ReactDOM.unmountComponentAtNode(portalContainer);
                const twitterIconTarget = document
                  .getElementById(block.id)
                  .getElementsByClassName("roamjs-twitter-icon")[0]
                  .closest(".bp3-popover-target") as HTMLSpanElement;
                twitterIconTarget.insertBefore(
                  portalContainer,
                  twitterIconTarget.firstElementChild
                );
                renderTooltip({
                  portalContainer,
                  tooltipMessage:
                    'Once your tweet is ready, click this icon and click "Schedule Tweet"',
                });
                twitterIconTarget.addEventListener(
                  "click",
                  () => {
                    ReactDOM.unmountComponentAtNode(portalContainer);
                    setTimeout(() => {
                      const scheduleTweetButton = document.getElementById(
                        "roamjs-schedule-tweet-button"
                      );
                      scheduleTweetButton.style.border = HIGHLIGHT;
                      scheduleTweetButton.addEventListener(
                        "click",
                        () =>
                          setTimeout(() => {
                            const timePicker = document.getElementsByClassName(
                              "bp3-datepicker-timepicker-wrapper"
                            )[0] as HTMLDivElement;
                            timePicker.style.border = HIGHLIGHT;
                            const sendButton = document.getElementById(
                              "roamjs-send-schedule-button"
                            );
                            sendButton.addEventListener(
                              "click",
                              () => {
                                setTimeout(() => {
                                  const refreshButton = document.getElementById(
                                    "roamjs-social-refresh-button"
                                  );
                                  refreshButton.insertBefore(
                                    portalContainer,
                                    refreshButton.firstChild
                                  );
                                  renderTooltip({
                                    portalContainer,
                                    tooltipMessage:
                                      "Congratulations, you scheduled your first tweet! Click this refresh button to track the status of the tweet",
                                  });
                                  refreshButton.addEventListener(
                                    "click",
                                    () => {
                                      ReactDOM.unmountComponentAtNode(
                                        portalContainer
                                      );
                                      setTimeout(() => {
                                        const statusTable = document.getElementsByClassName(
                                          "bp3-html-table"
                                        )[0] as HTMLTableElement;
                                        statusTable.insertBefore(
                                          portalContainer,
                                          statusTable.firstChild
                                        );
                                        renderTooltip({
                                          portalContainer,
                                          tooltipMessage:
                                            "You could schedule tweets from ANYWHERE in your graph. Then track all pending and successful tweets here!",
                                        });
                                        setTimeout(
                                          () =>
                                            ReactDOM.unmountComponentAtNode(
                                              portalContainer
                                            ),
                                          10000
                                        );
                                      }, 3000);
                                    }
                                  );
                                }, 3000);
                              },
                              { once: true }
                            );
                          }, 500),
                        { once: true }
                      );
                    }, 500);
                  },
                  { once: true }
                );
              }, 10000);
            }, 500);
            return true;
          }
          return false;
        });
      }, 500);
    };
    setAlertMessage(
      "Your Twitter setup is ready for scheduling tweets! Let's try scheduling one."
    );
  }, [setAlertMessage]);
  const stepTwo = useCallback(() => {
    const oauth = isTwitterOauthSet();
    if (!oauth) {
      window.roamAlphaAPI.createPage({ page: { title: "roam/js/twitter" } });
      const pullWatchListener = () => {
        if (isTwitterOauthSet()) {
          window.roamAlphaAPI.data.removePullWatch(
            "[*]",
            `[:node/title "roam/js/twitter"]`,
            pullWatchListener
          );
          stepThree();
        }
      };
      window.roamAlphaAPI.data.addPullWatch(
        "[*]",
        `[:node/title "roam/js/twitter"]`,
        pullWatchListener
      );
      alertCallback.current = () => {
        if (!document.getElementById("roamjs-twitter-login")) {
          const d = document.getElementsByClassName(
            "roam-article"
          )[0] as HTMLDivElement;
          const span = document.createElement("span");
          span.id = "roamjs-twitter-login";
          d.insertBefore(span, d.firstElementChild);
          loginRender(span);
        }
      };
      setAlertMessage(
        "We need to now connect your Twitter account to Roam. Click the login with Twitter button that will appear at the top of the screen."
      );
    } else {
      stepThree();
    }
  }, [setAlertMessage, alertCallback, stepThree]);
  const onClick = useCallback(() => {
    const twitterInstalled = window.roamjs.loaded.has("twitter");
    if (!twitterInstalled) {
      alertCallback.current = () => {
        const parentUid = getPageUidByPageTitle("roam/js");
        const blockUid = createBlock({
          node: {
            text: "{{[[roam/js]]}}",
            children: [{ text: codeBlockText, children: [] }],
          },
          parentUid,
          order: 0,
        });
        openBlockInSidebar(blockUid);
        setTimeout(() => {
          const codeBlocks = Array.from(
            document.getElementsByClassName("roam-block")
          ).filter((d) => d.id.endsWith(blockUid));
          codeBlocks.forEach((d) => {
            const stopThisButton = Array.from(
              d.getElementsByClassName("bp3-button")
            )
              .map((b) => b as HTMLButtonElement)
              .find(
                (b) =>
                  b.innerText.toUpperCase() === "YES, I KNOW WHAT I'M DOING."
              );
            stopThisButton.style.border = HIGHLIGHT;
            stopThisButton.addEventListener(
              "click",
              () => {
                stopThisButton.style.border = "unset";
                window.roamAlphaAPI.ui.rightSidebar.close();
                stepTwo();
              },
              { once: true }
            );
          });
        }, 1000);
      };
      setAlertMessage(
        "We first need to install the RoamJS Twitter extension. Would you like to install it?"
      );
    } else {
      stepTwo();
    }
  }, [setAlertMessage, alertCallback, stepTwo]);
  return (
    <>
      <Button onClick={onClick}>Setup</Button>
      <Alert
        isOpen={!!alertMessage}
        onConfirm={() => alertCallback.current()}
        onClose={onClose}
        cancelButtonText={"Cancel"}
      >
        {alertMessage}
      </Alert>
    </>
  );
};

const DeleteScheduledContent = ({ onConfirm }: { onConfirm: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <>
      <Button icon={"trash"} onClick={open} minimal />
      <Alert
        isOpen={isOpen}
        onClose={close}
        canOutsideClickCancel
        cancelButtonText={"Cancel"}
        canEscapeKeyCancel
        onConfirm={onConfirm}
      >
        Are you sure you want to remove this post?
      </Alert>
    </>
  );
};

const ScheduledContent: StageContent = () => {
  const authenticatedAxiosGet = useAuthenticatedAxiosGet();
  const authenticatedAxiosDelete = useAuthenticatedAxiosDelete();
  const pageUid = usePageUid();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([]);
  const refresh = useCallback(() => {
    setLoading(true);
    authenticatedAxiosGet("twitter-schedule")
      .then((r) => {
        setValid(true);
        setScheduledTweets(r.data.scheduledTweets);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setValid, authenticatedAxiosGet]);
  useEffect(() => {
    if (loading) {
      refresh();
    }
  }, [loading, refresh]);
  return loading ? (
    <Spinner />
  ) : valid ? (
    <>
      {scheduledTweets.length ? (
        <table className="bp3-html-table bp3-html-table-bordered bp3-html-table-striped">
          <thead>
            <tr>
              <th></th>
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
                    <td>
                      <DeleteScheduledContent
                        onConfirm={() =>
                          authenticatedAxiosDelete(
                            `social-schedule?uuid=${uuid}`
                          ).then(() =>
                            setScheduledTweets(
                              scheduledTweets.filter((t) => t.uuid !== uuid)
                            )
                          )
                        }
                      />
                    </td>
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
          <div style={{ color: "darkgoldenrod", margin: "16px 0" }}>
            You have not scheduled any content from Roam! You could use this
            service with the following extensions:
          </div>
          {SUPPORTED_CHANNELS.map((c) => (
            <Card style={{ width: "25%", textAlign: "center" }} key={c}>
              <h5>{c.toUpperCase()}</h5>
              <TwitterTutorial pageUid={pageUid} />
            </Card>
          ))}
        </>
      )}
      <Button
        minimal
        icon={"refresh"}
        onClick={refresh}
        id={"roamjs-social-refresh-button"}
        style={{ position: "absolute", top: 8, right: 8 }}
      />
    </>
  ) : (
    <div style={{ color: "darkred" }}>
      <h4>RoamJS Social Token is invalid.</h4>
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

const SocialDashboard = (): React.ReactElement => (
  <ServiceDashboard
    service={"social"}
    stages={[
      TOKEN_STAGE,
      {
        check: () => false,
        component: ScheduledContent,
      },
    ]}
  />
);

export default SocialDashboard;
