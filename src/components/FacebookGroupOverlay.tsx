import {
  Button,
  Icon,
  Popover,
  Radio,
  RadioGroup,
  Spinner,
} from "@blueprintjs/core";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getBlockUidFromTarget,
  getFirstChildUidByBlockUid,
  getTextByBlockUid,
} from "roam-client";
import FacebookLogo from "../assets/Facebook.svg";
import { resolveRefs } from "../entry-helpers";
import { getOauth } from "roamjs-components";

const FacebookGroupContent = ({
  blockUid,
  close,
}: {
  blockUid: string;
  close: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [activeGroup, setActiveGroup] = useState("");
  const message = useMemo(
    () => resolveRefs(getTextByBlockUid(getFirstChildUidByBlockUid(blockUid))),
    [blockUid]
  );
  const { userId, access_token } = JSON.parse(getOauth("facebook") || "{}");
  useEffect(() => {
    axios
      .get(
        `${process.env.API_URL}/facebook-groups?userId=${userId}&accessToken=${access_token}`
      )
      .then((r) => {
        setGroups(r.data.groups);
      })
      .finally(() => setLoading(false));
  }, [setLoading, setGroups]);
  return (
    <div style={{ padding: 16 }}>
      <RadioGroup
        selectedValue={activeGroup}
        onChange={(e) => setActiveGroup((e.target as HTMLInputElement).value)}
        label={"Select Group"}
      >
        {groups.map((g) => (
          <Radio key={g.id} value={g.id} label={g.name} />
        ))}
      </RadioGroup>
      <div>
        {loading && <Spinner size={Spinner.SIZE_SMALL} />}
        <Button
          text={"Send"}
          disabled={!activeGroup || loading || !message}
          onClick={() => {
            setLoading(true);
            axios
              .post(`${process.env.API_URL}/facebook-groups`, {
                accessToken: access_token,
                userId,
                groupId: activeGroup,
                message,
              })
              .then(close)
              .catch((e) => {
                const fbError = e.response?.data?.error?.message;
                if (fbError) {
                  createBlock({
                    parentUid: blockUid,
                    order: 1,
                    node: { text: fbError },
                  });
                  close();
                }
              })
              .finally(() => setLoading(false));
          }}
        />
      </div>
    </div>
  );
};

const FacebookGroupOverlay = ({
  blockUid,
}: {
  blockUid: string;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <Popover
      target={
        <span
          // For some reason, onclick wasn't triggering on Icon...
          onClick={open}
        >
          <Icon
            icon={
              <FacebookLogo
                style={{
                  width: 20,
                  height: 20,
                  marginTop: 2,
                  cursor: "pointer",
                }}
              />
            }
            onClick={open}
          />
        </span>
      }
      content={<FacebookGroupContent blockUid={blockUid} close={close} />}
      isOpen={isOpen}
      onClose={close}
    />
  );
};

export const render = (b: HTMLButtonElement): void => {
  const blockUid = getBlockUidFromTarget(b);
  ReactDOM.render(
    <FacebookGroupOverlay blockUid={blockUid} />,
    b.parentElement
  );
};

export default FacebookGroupOverlay;
