import { Button } from "@blueprintjs/core";
import React, { useState } from "react";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import deleteBlock from "roamjs-components/writes/deleteBlock";

const SavedSidebarConfig = ({ uid }: { uid?: string }): React.ReactElement => {
  const [states, setStates] = useState(() =>
    uid
      ? getBasicTreeByParentUid(uid).map(({ text, uid }) => ({
          text,
          uid,
        }))
      : []
  );
  return (
    <>
      {states.map((state) => (
        <div
          key={state.uid}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-block" }}>{state.text}</span>
          <Button
            icon={"trash"}
            style={{ width: 32 }}
            minimal
            onClick={() => {
              setStates(states.filter((s) => s.uid !== state.uid));
              deleteBlock(state.uid);
            }}
          />
        </div>
      ))}
    </>
  );
};

export default SavedSidebarConfig;
