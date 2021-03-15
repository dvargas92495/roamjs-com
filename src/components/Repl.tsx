import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import { getFirstChildUidByBlockUid } from "../entry-helpers";
import { Card } from "@blueprintjs/core";
import { getTreeByBlockUid } from "roam-client";

type ReplProps = {
  blockUid: string;
};

const evalRepl = (code: string) => {
  try {
    return JSON.stringify(eval(code));
  } catch (e) {
    return e.message;
  }
};

const Repl: React.FC<ReplProps> = ({ blockUid }) => {
  const [code, setCode] = useState(
    () => getTreeByBlockUid(blockUid).children[0].text
  );
  const onBeforeChange = useCallback((_, __, value) => setCode(value), [
    setCode,
  ]);
  const onChange = useCallback(
    (_, __, value) => {
      const childUid = getFirstChildUidByBlockUid(blockUid);
      if (childUid) {
        window.roamAlphaAPI.updateBlock({
          block: { uid: childUid, string: value },
        });
      } else {
        window.roamAlphaAPI.createBlock({
          location: { "parent-uid": blockUid, order: 0 },
          block: { string: value },
        });
      }
    },
    [blockUid]
  );
  return (
    <Card>
      <h2>RoamJS REPL</h2>
      <CodeMirror
        value={code}
        options={{
          mode: { name: "javascript", json: true },
          lineNumbers: true,
          lineWrapping: true,
        }}
        onBeforeChange={onBeforeChange}
        onChange={onChange}
      />
      <Card>
        <h4>Console</h4>
        <code>{evalRepl(code)}</code>
      </Card>
    </Card>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & ReplProps): void =>
  ReactDOM.render(<Repl {...props} />, p);

export default Repl;
