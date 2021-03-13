import {
  Alert,
  Button,
  Card,
  InputGroup,
  Intent,
  Label,
  Popover,
  Portal,
  Position,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import axios from "axios";
import format from "date-fns/format";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { createBlock, getTreeByPageName, PullBlock } from "roam-client";
import {
  getChildrenLengthByPageTitle,
  getPageUidByPageTitle,
  openBlockInSidebar,
  setInputSetting,
} from "../entry-helpers";
import { useSocialToken } from "./hooks";
import { HIGHLIGHT } from "./ServiceCommonComponents";
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

const watchOnce = (
  pullPattern: string,
  entityId: string,
  callback: (before: PullBlock, after: PullBlock) => boolean
) => {
  const watcher = (before: PullBlock, after: PullBlock) => {
    if (callback(before, after)) {
      window.roamAlphaAPI.data.removePullWatch(pullPattern, entityId, watcher);
    }
  };
  window.roamAlphaAPI.data.addPullWatch(pullPattern, entityId, watcher);
};

const isTwitterOauthSet = () =>
  getTreeByPageName("roam/js/twitter").some((t) => /oauth/i.test(t.text));

const TwitterTutorial = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [portalContainer, setPortalContainer] = useState(document.body);
  const onClose = useCallback(() => setAlertMessage(""), [setAlertMessage]);
  const alertCallback = useRef(() => console.log("No Alert Callback Set"));
  const stepThree = useCallback(() => {
    alertCallback.current = () => {
      const pageUid = getPageUidByPageTitle("roam/js/social");
      const length = getChildrenLengthByPageTitle("roam/js/social");
      const uid = window.roamAlphaAPI.util.generateUID();
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": pageUid, order: length },
        block: { uid, string: "" },
      });
      setTimeout(() => {
        watchOnce("[:block/string]", `[:block/uid "${uid}"]`, (_, after) => {
          const text = after[":block/string"];
          console.log(text, /{{(?:[[)?tweet(?:]])}}/i.test(text));
          return /{{(?:[[)?tweet(?:]])}}/i.test(text);
        });
        setPortalContainer(
          Array.from(document.getElementsByClassName("roam-block"))
            .find((d) => d.id.endsWith(uid))
            .parentElement.getElementsByClassName(
              "rm-bullet"
            )[0] as HTMLSpanElement
        );
        setTooltipMessage("First, type {{[[tweet]]}} into this block");
      }, 500);
    };
    setAlertMessage(
      "Your Twitter setup is ready for scheduling tweets! Let's try scheduling one."
    );
  }, [setAlertMessage, setPortalContainer, setTooltipMessage]);
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
      <Tooltip
        isOpen={!!tooltipMessage}
        position={Position.LEFT}
        content={
          <span style={{ width: 128, display: "inline-block" }}>
            {tooltipMessage}
          </span>
        }
      >
        {tooltipMessage && (
          <Portal container={portalContainer}>
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
              }}
              id="query-me"
            />
          </Portal>
        )}
      </Tooltip>
    </>
  );
};

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
          <div style={{ color: "darkgoldenrod", margin: "16px 0" }}>
            You have not scheduled any content from Roam! You could use this
            service with the following extensions:
          </div>
          {SUPPORTED_CHANNELS.map((c) => (
            <Card style={{ width: "25%" }} key={c}>
              <h5>{c.toUpperCase()}</h5>
              <TwitterTutorial />
            </Card>
          ))}
        </>
      )}
      <Button
        minimal
        icon={"refresh"}
        onClick={refresh}
        style={{ position: "absolute", top: 8, right: 8 }}
      />
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
    <Card style={{ position: "relative" }}>
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
