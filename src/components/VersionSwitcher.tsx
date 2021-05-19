import {
  Button,
  Classes,
  Dialog,
  Intent,
  Radio,
  RadioGroup,
  Spinner,
} from "@blueprintjs/core";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  getBlockUidsReferencingPage,
  getShallowTreeByParentUid,
  updateBlock,
} from "roam-client";
import { getRenderRoot } from "roamjs-components";

export type VersionSwitcherProps = {
  id: string;
  currentVersion: string;
};

const VersionSwitcher = ({
  id,
  currentVersion,
  onClose,
}: VersionSwitcherProps & {
  onClose: () => void;
}): React.ReactElement => {
  const extensionRegex = useMemo(
    () =>
      new RegExp(
        `https://roamjs\\.com/${id}(/\\d\\d\\d\\d-\\d\\d-\\d\\d-\\d\\d-\\d\\d)?/main.js`
      ),
    [id]
  );
  const [page, setPage] = useState(0);
  const [versions, setVersions] = useState([]);
  const [isEnd, setIsEnd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(currentVersion);
  useEffect(() => {
    setLoading(true);
    axios
      .get(
        `${process.env.REST_API_URL}/versions?limit=${
          page === 0 ? 4 : 5
        }&id=${id}&page=${page}`
      )
      .then((r) => {
        setVersions(
          page === 0 ? ["latest", ...r.data.versions] : r.data.versions
        );
        setIsEnd(r.data.isEnd);
      })
      .finally(() => setLoading(false));
  }, [page, id]);
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      canOutsideClickClose
      canEscapeKeyClose
      title={`Switch to version`}
    >
      <div className={Classes.DIALOG_BODY}>
        <RadioGroup
          onChange={(e) =>
            setSelectedValue((e.target as HTMLInputElement).value)
          }
          selectedValue={selectedValue}
          className={loading ? Classes.SKELETON : ""}
        >
          {versions.map((v) => (
            <Radio
              key={v}
              value={v}
              labelElement={
                <span>
                  <b>{v}</b>
                  {v === currentVersion && (
                    <span style={{ fontSize: 10 }}> (current)</span>
                  )}
                </span>
              }
            />
          ))}
        </RadioGroup>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={loading || page === 0}
            icon={"arrow-left"}
            text={"Newer"}
            onClick={() => setPage(Math.max(page - 5, 0))}
          />
          <Button
            disabled={loading || isEnd}
            icon={"arrow-right"}
            text={"Older"}
            onClick={() => setPage(page === 0 ? 4 : page + 5)}
          />
        </div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {loading && <Spinner size={Spinner.SIZE_SMALL} />}
          <Button
            text={"Switch"}
            disabled={loading}
            intent={Intent.PRIMARY}
            style={{ marginLeft: 16 }}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                getBlockUidsReferencingPage("roam/js")
                  .flatMap((u) => getShallowTreeByParentUid(u))
                  .filter(({ text }) => extensionRegex.test(text))
                  .forEach(({ uid, text }) =>
                    updateBlock({
                      uid,
                      text: text.replace(
                        extensionRegex,
                        `https://roamjs.com/${id}${
                          selectedValue === "latest" ? "" : `/${selectedValue}`
                        }/main.js`
                      ),
                    })
                  );
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }, 1);
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const render = (props: VersionSwitcherProps): void => {
  const parent = getRenderRoot(`versioning-${props.id}`);
  ReactDOM.render(
    React.createElement(VersionSwitcher, {
      ...props,
      onClose: () => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      },
    }),
    parent
  );
};

export default VersionSwitcher;
