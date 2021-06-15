import {
  Alert,
  Button,
  Card,
  Dialog,
  Intent,
  Popover,
  Position,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import format from "date-fns/format";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getPageUidByPageTitle,
  getParentUidByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  TreeNode,
  watchOnce,
} from "roam-client";
import {
  getChildrenLengthByPageTitle,
  openBlockInSidebar,
  resolveRefs,
} from "../entry-helpers";
import {
  SERVICE_TOKEN_STAGE,
  ServiceDashboard,
  StageContent,
  useAuthenticatedDelete,
  useAuthenticatedGet,
  useAuthenticatedPut,
  useServicePageUid,
  WrapServiceMainStage,
} from "roamjs-components";
import { render as loginRender } from "../components/TwitterLogin";
import startOfMinute from "date-fns/startOfMinute";
import addMinutes from "date-fns/addMinutes";
import endOfYear from "date-fns/endOfYear";
import addYears from "date-fns/addYears";
import { DatePicker } from "@blueprintjs/datetime";

const HIGHLIGHT = "3px dashed yellowgreen";

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
  extension.src = "${
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080/build"
      : "https://roamjs.com"
  }/twitter.js";
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
      position={Position.LEFT_TOP}
      content={
        <span style={{ width: 128, display: "inline-block" }}>
          {tooltipMessage}
        </span>
      }
    >
      <span />
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
      const showBlocks = document.getElementById("roamjs-service-hide-blocks");
      if (showBlocks) {
        showBlocks.click();
      }
      setTimeout(() => {
        const portalContainer = document.createElement("span");
        portalContainer.id = "roamjs-social-guide";
        portalContainer.style.display = "inline-block";
        portalContainer.style.height = "100%";
        portalContainer.style.width = "100%";
        portalContainer.style.position = "absolute";
        portalContainer.style.top = "0";
        portalContainer.style.bottom = "0";
        portalContainer.style.left = "0";
        portalContainer.style.right = "0";
        portalContainer.style.pointerEvents = "none";
        const { block, bullet: parent } = getBulletElement(uid);
        parent.appendChild(portalContainer);
        renderTooltip({
          portalContainer,
          tooltipMessage: "First, type {{[[tweet]]}} into this block",
        });
        watchOnce("[:block/string]", `[:block/uid "${uid}"]`, (_, after) => {
          if (/{{(?:\[\[)?tweet(?:\]\])?}}/i.test(after[":block/string"])) {
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
                const { bullet: parentAgain } = getBulletElement(uid);
                const twitterIconTarget = document
                  .getElementById(block.id)
                  .getElementsByClassName("roamjs-twitter-icon")[0]
                  .closest(".bp3-popover-target") as HTMLSpanElement;
                parentAgain.appendChild(portalContainer);
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
                                        const unmount = () =>
                                          ReactDOM.unmountComponentAtNode(
                                            portalContainer
                                          );
                                        setTimeout(unmount, 10000);
                                        document.addEventListener(
                                          "click",
                                          unmount,
                                          { once: true }
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
      setTimeout(() => {
        const d = document.getElementById(
          "roamjs-alert-guide"
        ) as HTMLDivElement;
        const span = document.createElement("span");
        span.id = "roamjs-twitter-login";
        span.style.display = "inline-block";
        span.style.width = "100%";
        span.style.textAlign = "center";
        span.style.marginTop = "16px";
        d.appendChild(span);
        loginRender(span);
        const styleEl = document.createElement("style");
        styleEl.innerText = `.bp3-alert-footer {
  display: none;
}`;
        span.appendChild(styleEl);
      }, 1);
      setAlertMessage(
        "We need to now connect your Twitter account to Roam. Click the login with Twitter button below"
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
      <Button onClick={onClick}>Start</Button>
      <Alert
        isOpen={!!alertMessage}
        onConfirm={() => alertCallback.current()}
        onClose={onClose}
        cancelButtonText={"Cancel"}
        canOutsideClickCancel
        canEscapeKeyCancel
      >
        <div id={"roamjs-alert-guide"}>{alertMessage}</div>
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
      <Button
        style={{ minHeight: 20, height: 20, minWidth: 20 }}
        icon={"trash"}
        onClick={open}
        minimal
      />
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

type Payload = {
  text: string;
  uid: string;
  children: Payload[];
};

const trimPayload = (node: TreeNode): Payload => ({
  text: node.text,
  uid: node.uid,
  children: node.children.map(trimPayload),
});

const EditScheduledContent = ({
  onConfirm,
  uuid,
  date,
  blockUid,
}: {
  onConfirm: (body: { date: string }) => void;
  uuid: string;
  date: Date;
  blockUid: string;
}) => {
  const authenticatedAxiosPut = useAuthenticatedPut();
  const initialDate = useMemo(
    () => addMinutes(startOfMinute(new Date()), 1),
    []
  );
  const [scheduleDate, setScheduleDate] = useState(date);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const payload = useMemo(() => {
    const parentUid = getParentUidByBlockUid(blockUid);
    const { text, children } = getTreeByBlockUid(parentUid);
    const blocks = children
      .map((t) => ({
        ...t,
        text: resolveRefs(t.text),
      }))
      .map(trimPayload);
    const tweetId = /\/([a-zA-Z0-9_]{1,15})\/status\/([0-9]*)\??/.exec(
      text
    )?.[2];
    return JSON.stringify({ blocks, tweetId });
  }, [blockUid]);
  const onClick = useCallback(() => {
    setLoading(true);
    const date = scheduleDate.toJSON();
    authenticatedAxiosPut("social-schedule", {
      uuid,
      scheduleDate: date,
      payload,
    })
      .then(() => {
        onConfirm({ date });
        close();
      })
      .catch(() => setLoading(false));
  }, [uuid, scheduleDate, payload, authenticatedAxiosPut, onConfirm, close]);
  return (
    <>
      <Button
        style={{ minHeight: 20, height: 20, minWidth: 20 }}
        icon={"edit"}
        onClick={open}
        minimal
      />
      <Dialog
        title={"Edit Post"}
        isOpen={isOpen}
        onClose={close}
        canEscapeKeyClose
        canOutsideClickClose
        style={{ width: 256 }}
      >
        <DatePicker
          value={scheduleDate}
          onChange={setScheduleDate}
          minDate={initialDate}
          maxDate={addYears(endOfYear(initialDate), 5)}
          timePrecision={"minute"}
          highlightCurrentDay
          className={"roamjs-datepicker"}
          timePickerProps={{ useAmPm: true, showArrowButtons: true }}
        />
        <span style={{ margin: 16 }}>
          Are you sure you want to edit the time and content of this post?
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginRight: 16,
          }}
        >
          {loading && <Spinner size={Spinner.SIZE_SMALL} />}
          <Button
            onClick={onClick}
            intent={Intent.PRIMARY}
            style={{ marginLeft: 8 }}
          >
            Submit
          </Button>
        </div>
      </Dialog>
    </>
  );
};

const ScheduledContent: StageContent = () => {
  const authenticatedAxiosGet = useAuthenticatedGet();
  const authenticatedAxiosDelete = useAuthenticatedDelete();
  const pageUid = useServicePageUid();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([]);
  const refresh = useCallback(() => {
    setLoading(true);
    authenticatedAxiosGet("twitter-schedule")
      .then((r) => {
        setValid(true);
        setScheduledTweets(
          (r.data.scheduledTweets as ScheduledTweet[]).sort(
            ({ createdDate: a }, { createdDate: b }) =>
              new Date(b).valueOf() - new Date(a).valueOf()
          )
        );
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
        <table
          className="bp3-html-table bp3-html-table-bordered bp3-html-table-striped"
          style={{ border: "1px solid rgba(16,22,26,0.15)" }}
        >
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
                      {statusProps.status === "PENDING" && (
                        <EditScheduledContent
                          uuid={uuid}
                          date={new Date(scheduledDate)}
                          blockUid={blockUid}
                          onConfirm={({ date }) =>
                            setScheduledTweets(
                              scheduledTweets.map((t) =>
                                t.uuid === uuid
                                  ? { ...t, scheduledDate: date }
                                  : t
                              )
                            )
                          }
                        />
                      )}
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
                              <div style={{ padding: 16 }}>
                                {statusProps.message}
                              </div>
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
    stages={[SERVICE_TOKEN_STAGE, WrapServiceMainStage(ScheduledContent)]}
  />
);

export default SocialDashboard;
