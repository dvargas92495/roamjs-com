import {
  Button,
  Checkbox,
  Intent,
  Popover,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import { addDays } from "date-fns";
import addYears from "date-fns/addYears";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  DAILY_NOTE_PAGE_TITLE_REGEX,
  createBlock,
  createPage,
  getChildrenLengthByPageUid,
  getPageUidByPageTitle,
  getPageTitleByBlockUid,
  getTextByBlockUid,
  getUids,
  getUidsFromId,
  parseRoamDate,
  toRoamDate,
  updateBlock,
} from "roam-client";

const MoveTodoMenu = ({
  blockUid,
  p,
  onSuccess,
  archivedDefault,
}: {
  blockUid: string;
  p: HTMLElement;
  archivedDefault: boolean;
  onSuccess: () => void;
}): React.ReactElement => {
  const tomorrow = useMemo(() => {
    const title = getPageTitleByBlockUid(blockUid);
    const ref = DAILY_NOTE_PAGE_TITLE_REGEX.test(title)
      ? parseRoamDate(title)
      : new Date();
    return addDays(ref, 1);
  }, []);
  const maxDate = useMemo(() => { // https://github.com/palantir/blueprint/issues/877
    return addYears(tomorrow, 5);
  }, [tomorrow]);
  const [target, setTarget] = useState(tomorrow);
  const unmountRef = useRef(0);
  const unmount = useCallback(() => {
    unmountRef.current = window.setTimeout(() => {
      ReactDOM.unmountComponentAtNode(p);
    }, 200);
  }, [unmountRef]);
  const clear = useCallback(() => {
    clearTimeout(unmountRef.current);
  }, [unmountRef]);
  useEffect(() => {
    p.parentElement.onmouseleave = unmount;
    p.parentElement.addEventListener("mouseenter", clear);
  }, [clear, unmount]);
  const [loading, setLoading] = useState(false);
  const [archive, setArchive] = useState(archivedDefault);
  const onClick = () => {
    setLoading(true);
    const blockUids = [
      blockUid,
      ...Array.from(document.getElementsByClassName("block-highlight-blue"))
        .map((d) => getUids(d.querySelector(".roam-block")).blockUid)
        .filter((b) => b !== blockUid),
    ];
    const targetDate = toRoamDate(target);
    const parentUid =
      getPageUidByPageTitle(targetDate) || createPage({ title: targetDate });
    const order = getChildrenLengthByPageUid(parentUid);
    Promise.all(
      blockUids.map(
        (buid, i) =>
          new Promise<void>((resolve) => {
            const text = getTextByBlockUid(buid);
            setTimeout(() => {
              const uid = createBlock({
                node: { text: `${text} [*](((${buid})))` },
                order: order + i,
                parentUid,
              });
              updateBlock({
                uid: buid,
                text: `${text.replace(
                  /{{(\[\[)?TODO(\]\])?}}\s*/,
                  `[→](((${uid}))) {{[[${archive ? "ARCHIVED" : "DONE"}]]}} `
                )}`,
              });
              resolve();
            }, 1);
          })
      )
    ).then(() => {
      Array.from(
        document.getElementsByClassName("block-highlight-blue")
      ).forEach((d) => d.classList.remove("block-highlight-blue"));
      unmount();
      onSuccess();
    });
  };
  return (
    <Popover
      target={
        <Tooltip content={"Move to Another Date"}>
          <Button
            minimal
            icon={"play"}
            style={{ minHeight: 18, height: 18, width: 18, minWidth: 18 }}
            onClick={() => {
              const blockIds = Array.from(
                document.getElementsByClassName("block-highlight-blue")
              )
                .map((d) => d.querySelector(".roam-block")?.id)
                .filter((d) =>
                  /{{\[\[TODO\]\]}}/.test(
                    getTextByBlockUid(getUidsFromId(d).blockUid)
                  )
                );
              setTimeout(() => {
                blockIds.forEach((id) =>
                  document
                    .getElementById(id)
                    .closest(".roam-block-container")
                    .classList.add("block-highlight-blue")
                );
              }, 1);
            }}
          />
        </Tooltip>
      }
      content={
        <div
          style={{ padding: 16 }}
          onMouseEnter={clear}
          onMouseMove={clear}
          onMouseLeave={unmount}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DatePicker
            value={target}
            onChange={(s) => setTarget(s)}
            minDate={tomorrow}
            maxDate={maxDate}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={onClick}
              intent={Intent.PRIMARY}
              disabled={loading}
              text={loading ? <Spinner size={Spinner.SIZE_SMALL} /> : "Move"}
            />
            {window.roamjs.loaded.has("todont") && (
              <Checkbox
                label={"Archive"}
                checked={archive}
                onChange={(e) =>
                  setArchive((e.target as HTMLInputElement).checked)
                }
              />
            )}
          </div>
        </div>
      }
    />
  );
};

export const render = ({
  p,
  blockUid,
  archivedDefault,
}: {
  p: HTMLElement;
  blockUid: string;
  archivedDefault: boolean;
}): void => {
  const block = p.parentElement;
  const onEnter = () =>
    !p.childElementCount &&
    ReactDOM.render(
      <MoveTodoMenu
        p={p}
        blockUid={blockUid}
        onSuccess={() => block.removeEventListener("mouseenter", onEnter)}
        archivedDefault={archivedDefault}
      />,
      p
    );
  block.addEventListener("mouseenter", onEnter);
};

export default MoveTodoMenu;
