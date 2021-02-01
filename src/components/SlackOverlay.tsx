import { Button, Icon, Popover, Spinner } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import Slack from "../assets/Slack_Mark.svg";
import { WebClient } from "@slack/web-api";
import {
  getTreeByPageName,
  TreeNode,
  getEditedUserEmailByBlockUid,
  getTextByBlockUid,
} from "roam-client";

type ContentProps = {
  tag: string;
  blockUid: string;
};

type SlackMember = { real_name: string; id: string; name: string };

const getSettingValueFromTree = ({
  tree,
  key,
  defaultValue = "",
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: string;
}) => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node ? node.children[0].text : defaultValue;
  return value;
};

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
    ? Object.fromEntries(node.children.map((s) => [s.text, s.children[0].text]))
    : defaultValue;
  return value;
};

export const getUserFormat = (tree: TreeNode[]): string =>
  getSettingValueFromTree({
    tree,
    key: "user format",
    defaultValue: "@{username}",
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
  const onClick = useCallback(() => {
    setLoading(true);
    const tree = getTreeByPageName("roam/js/slack");
    const token = getSettingValueFromTree({ tree, key: "token" });
    const userFormat = getUserFormat(tree);
    const aliases = getAliases(tree);
    const aliasedName = aliases[tag].toUpperCase();
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
          m.name.toUpperCase() === tag.match(usernameRegex)[1].toUpperCase()
      : () => false;
    const contentFormat = getSettingValueFromTree({
      tree,
      key: "content format",
      defaultValue: "{block}",
    });

    web.users
      .list({ token })
      .then((r) => {
        const members = r.members as {
          real_name: string;
          id: string;
          name: string;
        }[];
        const memberId = members.find(
          (m) => m.name.toUpperCase() === aliasedName || findFunction(m)
        )?.id;
        return web.chat.postMessage({
          channel: memberId,
          text: contentFormat
            .replace(/{block}/i, message.replace(`#[[${r}]]`, ""))
            .replace(/{last edited by}/i, () =>
              getEditedUserEmailByBlockUid(blockUid)
            ),
          token,
        });
      })
      .then(close)
      .catch(() => setLoading(false));
  }, [setLoading, close, tag]);
  return (
    <div style={{ padding: 16 }}>
      <Button text={`Send to ${tag}`} onClick={onClick} />
      {loading && <Spinner />}
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
