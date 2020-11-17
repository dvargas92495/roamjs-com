import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { Chart, SeriesType } from "react-charts";
import { getTextTreeByBlockUid } from "../entry-helpers";
import { Button } from "@blueprintjs/core";
import { getUids, openBlock } from "roam-client";

export const CHARTS_WRAPPER = "roamjs-charts-wrapper";
export const styleContent = `.${CHARTS_WRAPPER} {
    height: 300px;
    width: 400px;
    position: relative;
}`;

const getData = (blockId: string) => {
  const { blockUid } = getUids(
    document.getElementById(blockId).closest(".roam-block") as HTMLDivElement
  );
  const tree = getTextTreeByBlockUid(blockUid);
  return tree.children.map((t) => ({
    label: t.text,
    data: t.children.map((c) =>
      c.text.split(",").map((n) => parseInt(n.trim()))
    ),
  }));
};

const Charts = ({
  data,
  type,
  editCallback = () => {},
}: {
  type: SeriesType;
  data: { label: string; data: number[][] }[];
  editCallback?: () => void;
}) => {
  const axes = React.useMemo(
    () => [
      { primary: true, type: "linear", position: "bottom" },
      { type: "linear", position: "left" },
    ],
    []
  );
  const series = React.useMemo(() => ({ type }), []);
  const [showEditIcon, setShowEditIcon] = useState(false);
  const appear = useCallback(() => setShowEditIcon(true), [setShowEditIcon]);
  const disappear = useCallback(() => setShowEditIcon(false), [
    setShowEditIcon,
  ]);
  return (
    <div
      className={CHARTS_WRAPPER}
      onMouseOver={appear}
      onMouseLeave={disappear}
    >
      {showEditIcon && (
        <Button
          icon="edit"
          minimal
          style={{ position: "absolute", top: 8, right: 8 }}
          onClick={editCallback}
        />
      )}
      <Chart data={data} axes={axes} series={series} />
    </div>
  );
};

const editCallback = (blockId: string) => () =>
  openBlock(document.getElementById(blockId));

export const renderLineChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}) =>
  ReactDOM.render(
    <Charts
      type={"line"}
      data={getData(blockId)}
      editCallback={editCallback(blockId)}
    />,
    parent
  );

export const renderBarChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}) =>
  ReactDOM.render(
    <Charts
      type={"bar"}
      data={getData(blockId)}
      editCallback={editCallback(blockId)}
    />,
    parent
  );

export const DemoCharts = () => {
  const data = React.useMemo(
    () => [
      {
        label: "Series 1",
        data: [
          [0, 1],
          [1, 2],
          [2, 4],
          [3, 2],
          [4, 7],
        ],
      },
      {
        label: "Series 2",
        data: [
          [0, 3],
          [1, 1],
          [2, 5],
          [3, 6],
          [4, 4],
        ],
      },
    ],
    []
  );
  return <Charts data={data} type={"line"} />;
};

export default Charts;
