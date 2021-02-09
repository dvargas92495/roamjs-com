import { Button, Icon, Popover, Spinner, Text } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";
import { WebClient } from "@slack/web-api";
import {
  getTreeByPageName,
  TreeNode,
  getDisplayNameByEmail,
  getEditedUserEmailByBlockUid,
  getPageTitleByBlockUid,
  getParentTextByBlockUid,
  getParentTextByBlockUidAndTag,
  getTextByBlockUid,
} from "roam-client";
import { getSettingValueFromTree } from "./hooks";
import { resolveRefs } from "../entry-helpers";

type ContentProps = {
  tag: string;
  blockUid: string;
};

type SlackMember = {
  real_name: string;
  id: string;
  name: string;
  profile: { email: string; display_name?: string };
};

const toName = (s: SlackMember) => s.profile.display_name || s.name;

const getSettingMapFromTree = ({
  tree,
  key,
  defaultValue = {},
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: { [key: string]: string };
}) => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node
    ? Object.fromEntries(
        node.children.map((s) => [s.text.trim(), s.children[0].text.trim()])
      )
    : defaultValue;
  return value;
};

export const getUserFormat = (tree: TreeNode[]): string =>
  getSettingValueFromTree({
    tree,
    key: "user format",
    defaultValue: "@{username}",
  });

export const getChannelFormat = (tree: TreeNode[]): string =>
  getSettingValueFromTree({
    tree,
    key: "channel format",
    defaultValue: "#{channel}",
  });

export const getAliases = (tree: TreeNode[]): { [key: string]: string } =>
  getSettingMapFromTree({ key: "aliases", tree });

const web = new WebClient();
delete web["axios"].defaults.headers["User-Agent"];

const SlackContent: React.FunctionComponent<
  ContentProps & { close: () => void }
> = ({ tag, close, blockUid }) => {
  const message = getTextByBlockUid(blockUid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onClick = useCallback(() => {
    setLoading(true);
    setError("");
    const tree = getTreeByPageName("roam/js/slack");
    const token = getSettingValueFromTree({ tree, key: "token" });
    const userFormat = getUserFormat(tree);
    const channelFormat = getChannelFormat(tree);
    const aliases = getAliases(tree);
    const aliasedName = aliases[tag]?.toUpperCase?.();
    const realNameRegex = new RegExp(
      userFormat.replace("{real name}", "(.*)"),
      "i"
    );
    const usernameRegex = new RegExp(
      userFormat.replace("{username}", "(.*)"),
      "i"
    );
    const findFunction = realNameRegex.test(tag)
      ? (m: SlackMember) =>
          m.real_name.toUpperCase() ===
          tag.match(realNameRegex)[1].toUpperCase()
      : usernameRegex.test(tag)
      ? (m: SlackMember) =>
          toName(m).toUpperCase() === tag.match(usernameRegex)[1].toUpperCase()
      : () => false;
    const contentFormat = getSettingValueFromTree({
      tree,
      key: "content format",
      defaultValue: "{block}",
    });
    Promise.all([web.users.list({ token }), web.conversations.list({ token })])
      .then(([userResponse, channelResponse]) => {
        const members = userResponse.members as SlackMember[];
        const memberId = members.find(
          (m) => toName(m).toUpperCase() === aliasedName || findFunction(m)
        )?.id;
        const channelId = 0;
        if (memberId) {
          return web.chat
            .postMessage({
              channel: memberId,
              text: contentFormat
                .replace(/{block}/gi, resolveRefs(message))
                .replace(/{last edited by}/gi, () => {
                  const email = getEditedUserEmailByBlockUid(blockUid);
                  const displayName = getDisplayNameByEmail(email);
                  const memberByEmail = members.find(
                    (m) => m.profile.email === email
                  );
                  return memberByEmail
                    ? `@${toName(memberByEmail)}`
                    : displayName || email;
                })
                .replace(/{page}/gi, () => getPageTitleByBlockUid(blockUid))
                .replace(
                  /{parent(?::\s*((?:#?\[\[[^\]]*\]\]\s*)+))?}/gi,
                  (_, t: string) =>
                    resolveRefs(
                      t
                        ? t
                            .trim()
                            .substring(2, t.trim().length - 2)
                            .split(/\]\]\s*\[\[/)
                            .map((tag) =>
                              getParentTextByBlockUidAndTag({ blockUid, tag })
                            )
                            .find((s) => !!s) ||
                            getParentTextByBlockUid(blockUid)
                        : getParentTextByBlockUid(blockUid)
                    )
                )
                .replace(
                  /{link}/gi,
                  `${window.location.href.replace(
                    /\/page\/.*$/,
                    ""
                  )}/page/${blockUid}`
                ),
              token,
            })
            .then(close);
        } else {
          setLoading(false);
          setError(
            `Couldn't find Slack user for tag: ${tag}.${
              aliasedName ? `\nTried to use alias: ${aliases[tag]}` : ""
            }\nFound: ${members.map(toName).join(", ")}`
          );
        }
      })
      .catch(({ error, message }) => {
        setError(error || message);
        setLoading(false);
      });
  }, [setLoading, close, tag, setError]);
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send to ${tag}`} onClick={onClick} />
      {loading && <Spinner />}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          <Text>{error}</Text>
        </div>
      )}
    </div>
  );
};

const SlackOverlay: React.FunctionComponent<ContentProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      target={
        <Icon
          icon={
            <Slack
              viewBox="70 70 130 130"
              style={{ width: 15, marginLeft: 4 }}
            />
          }
          onClick={open}
        />
      }
      content={<SlackContent {...props} close={close} />}
      isOpen={isOpen}
      onInteraction={setIsOpen}
    />
  );
};

export const render = ({
  parent,
  ...contentProps
}: {
  parent: HTMLSpanElement;
} & ContentProps): void =>
  ReactDOM.render(<SlackOverlay {...contentProps} />, parent);

export default SlackOverlay;
