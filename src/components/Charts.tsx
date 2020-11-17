import React from "react";
import ReactDOM from "react-dom";
import { Chart, SeriesType } from "react-charts";
import { getTextTreeByBlockUid } from "../entry-helpers";

export const CHARTS_WRAPPER = "roamjs-charts-wrapper";
export const styleContent = `.${CHARTS_WRAPPER} {
    height: 300px;
    width: 400px;
}`;

const getData = (blockUid: string) => {
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
}: {
  type: SeriesType;
  data: { label: string; data: number[][] }[];
}) => {
  const axes = React.useMemo(
    () => [
      { primary: true, type: "linear", position: "bottom" },
      { type: "linear", position: "left" },
    ],
    []
  );
  const series = React.useMemo(() => ({ type }), []);
  return (
    <div className={CHARTS_WRAPPER}>
      <Chart data={data} axes={axes} series={series} />;
    </div>
  );
};

export const renderLineChart = ({
  blockUid,
  parent,
}: {
  blockUid: string;
  parent: HTMLElement;
}) =>
  ReactDOM.render(<Charts type={"line"} data={getData(blockUid)} />, parent);

export const renderBarChart = ({
  blockUid,
  parent,
}: {
  blockUid: string;
  parent: HTMLElement;
}) => ReactDOM.render(<Charts type={"bar"} data={getData(blockUid)} />, parent);

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
  return <Charts data={data} type={'line'}/>;
};

export default Charts;
