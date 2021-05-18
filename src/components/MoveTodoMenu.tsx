import { Button, Intent, Popover, Spinner, Tooltip } from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import { addDays } from "date-fns";
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
  createPage,
  getChildrenLengthByPageUid,
  getPageUidByPageTitle,
  getTextByBlockUid,
  toRoamDate,
  updateBlock,
} from "roam-client";

const MoveTodoMenu = ({
  blockUid,
  p,
  onSuccess,
}: {
  blockUid: string;
  p: HTMLElement;
  onSuccess: () => void;
}): React.ReactElement => {
  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const [target, setTarget] = useState(tomorrow);
  const unmountRef = useRef(0);
  const unmount = useCallback(() => {
    unmountRef.current = window.setTimeout(() => {
      ReactDOM.unmountComponentAtNode(p);
    }, 100);
  }, [unmountRef]);
  const clear = useCallback(() => {
    clearTimeout(unmountRef.current);
  }, [unmountRef]);
  useEffect(() => {
    p.parentElement.onmouseleave = unmount;
    p.parentElement.addEventListener("mouseenter", clear);
  }, [clear, unmount]);
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    setLoading(true);
    const text = getTextByBlockUid(blockUid);
    const targetDate = toRoamDate(target);
    const parentUid =
      getPageUidByPageTitle(targetDate) || createPage({ title: targetDate });
    setTimeout(() => {
      const order = getChildrenLengthByPageUid(parentUid);
      const uid = createBlock({
        node: { text: `${text} [*](((${blockUid})))` },
        order,
        parentUid,
      });
      updateBlock({
        uid: blockUid,
        text: `${text.replace(
          /{{(\[\[)?TODO(\]\])?}}\s*/,
          ""
        )} [*](((${uid})))`,
      });
      unmount();
      onSuccess();
    }, 1);
  }, [blockUid, target, unmount, onSuccess]);
  return (
    <Popover
      target={
        <Tooltip content={"Move to Another Date"}>
          <Button
            minimal
            icon={"play"}
            style={{ minHeight: 18, height: 18, width: 18, minWidth: 18 }}
          />
        </Tooltip>
      }
      content={
        <div
          style={{ padding: 16 }}
          onMouseEnter={clear}
          onMouseLeave={unmount}
        >
          <DatePicker
            value={target}
            onChange={(s) => setTarget(s)}
            minDate={tomorrow}
          />
          <Button
            onClick={onClick}
            intent={Intent.PRIMARY}
            disabled={loading}
            text={loading ? <Spinner size={Spinner.SIZE_SMALL} /> : "Move"}
          />
        </div>
      }
    />
  );
};

export const render = ({
  p,
  blockUid,
}: {
  p: HTMLElement;
  blockUid: string;
}): void => {
  const block = p.parentElement;
  const onEnter = () =>
    !p.childElementCount &&
    ReactDOM.render(
      <MoveTodoMenu
        p={p}
        blockUid={blockUid}
        onSuccess={() => block.removeEventListener("mouseenter", onEnter)}
      />,
      p
    );
  block.addEventListener("mouseenter", onEnter);
};

export default MoveTodoMenu;
