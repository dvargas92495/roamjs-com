import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/javascript/javascript";
import { getFirstChildUidByBlockUid } from "../entry-helpers";
import { Card } from "@blueprintjs/core";
import { getTreeByBlockUid } from "roam-client";

type ReplProps = {
  blockUid: string;
};

const EvalRepl = ({ code }: { code: string }) => {
  const [output, setOutput] = useState("");
  const evalRef = useRef(0);
  useEffect(() => {
    setOutput("Running...");
    window.clearTimeout(evalRef.current);
    evalRef.current = window.setTimeout(() => {
      try {
        const lines = code.split("\n");
        const mappedLines = lines.map((l, i) =>
          i === lines.length - 1 && !l.startsWith("return ") ? `return ${l}` : l
        );
        setOutput(`${Function(`"use strict";${mappedLines.join("\n")}`)()}`);
      } catch (e) {
        setOutput(e.message);
      }
    }, 3000);
  }, [evalRef, code, setOutput]);
  return <code>{output}</code>;
};

const Repl: React.FC<ReplProps> = ({ blockUid }) => {
  const [code, setCode] = useState(
    () => getTreeByBlockUid(blockUid).children?.[0]?.text
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
    <div style={{ display: "flex" }}>
      <Card style={{ width: "60%", padding: "0 1px 0 0" }}>
        <h4 style={{ textAlign: "center" }}>RoamJS REPL</h4>
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
      </Card>
      <Card style={{ width: "40%", padding: "0 1px" }}>
        <h4 style={{ textAlign: "center" }}>Console</h4>
        <EvalRepl code={code}/>
      </Card>
    </div>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & ReplProps): void =>
  ReactDOM.render(<Repl {...props} />, p);

export default Repl;
