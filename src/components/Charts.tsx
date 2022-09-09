import React, { useState } from "react";
import ReactDOM from "react-dom";
import { AxisType, Chart, SeriesType } from "react-charts";
import {
  Card,
  Elevation,
  H6,
  Icon,
  InputGroup,
  Label,
} from "@blueprintjs/core";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import parse from "date-fns/parse";
import EditContainer from "./EditContainer";
import getUids from "roamjs-components/dom/getUids";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";

const CHARTS_WRAPPER = "roamjs-charts-wrapper";
const CHART_WRAPPER = "roamjs-charts-chart-wrapper";
const LEGEND_WRAPPER = "roamjs-charts-legend-wrapper";
export const styleContent = `.${CHART_WRAPPER} {
    height: 300px;
    width: 400px;
}

.${CHARTS_WRAPPER} {
  display: flex;
}

.${LEGEND_WRAPPER} {
  padding: 8px; 
  display: flex; 
  flex-direction: column;
}`;

// https://github.com/tannerlinsley/react-charts/blob/4217531a930db36b66e3a145096faf2c9e64f5b1/src/components/Chart.js#L30
const defaultColorScheme = [
  "#0f83ab",
  "#faa43a",
  "#ff4e4e",
  "#53cfc9",
  "#a2d925",
  "#decf3f",
  "#734fe9",
  "#cd82ad",
  "#006d92",
  "#de7c00",
  "#f33232",
  "#3f9a80",
  "#53c200",
  "#d7af00",
  "#4c26c9",
  "#d44d99",
];

const parseAxis: {
  [key in AxisType]: (value: string, format?: string) => string | number | Date;
} = {
  linear: (v: string) => (v ? parseFloat(v) : 0),
  ordinal: (v: string) => v,
  time: (v: string, format: string) => {
    try {
      const d = parse(v, format, new Date());
      return isNaN(d.valueOf()) ? new Date() : d;
    } catch {
      return new Date();
    }
  },
  log: (v: string) => v,
  utc: (v: string) => v,
};

const BOTTOM_TYPE_KEY = "X-Axis::";
const LEFT_TYPE_KEY = "Y-Axis::";
const DATE_FORMAT_KEY = "Date Format::";
const getProps = (blockId: string) => {
  const { blockUid } = getUids(
    document.getElementById(blockId).closest(".roam-block") as HTMLDivElement
  );
  const tree = getBasicTreeByParentUid(blockUid);
  const dataNodes = tree.filter((t) => t.text.indexOf("::") <= -1);
  const metaDataNodes = tree.filter((t) => t.text.indexOf("::") > -1);
  const bottomTypeNode = metaDataNodes.find((t) =>
    t.text.startsWith(BOTTOM_TYPE_KEY)
  );
  const leftTypeNode = metaDataNodes.find((t) =>
    t.text.startsWith(LEFT_TYPE_KEY)
  );
  const dateFormatNode = metaDataNodes.find((t) =>
    t.text.startsWith(DATE_FORMAT_KEY)
  );
  return {
    data: dataNodes.map((t) => ({
      label: t.text,
      data: t.children.map((c) => c.text),
    })),
    initialBottomType: bottomTypeNode
      ? (bottomTypeNode.text
          .substring(BOTTOM_TYPE_KEY.length)
          .trim()
          .toLowerCase() as AxisType)
      : "linear",
    initialLeftType: leftTypeNode
      ? (leftTypeNode.text
          .substring(LEFT_TYPE_KEY.length)
          .trim()
          .toLowerCase() as AxisType)
      : "linear",
    initialDateFormat:
      dateFormatNode &&
      dateFormatNode.text.substring(DATE_FORMAT_KEY.length).trim(),
  };
};

const Charts = ({
  data,
  type,
  initialBottomType,
  initialLeftType,
  initialDateFormat = "MM/dd/yyyy",
  blockId = "",
}: {
  type: SeriesType;
  data: { label: string; data: string[] }[];
  blockId?: string;
  initialBottomType: AxisType;
  initialLeftType: AxisType;
  initialDateFormat?: string;
}): JSX.Element => {
  const [dateFormat, setDateFormat] = useState(initialDateFormat);
  const [leftType, setLeftType] = useState<AxisType>(initialLeftType);
  const [bottomType, setBottomType] = useState<AxisType>(initialBottomType);
  const chartData = React.useMemo(
    () =>
      data.flatMap((d) => {
        const labelSplit = d.label.split(",");
        const dataSplit = d.data
          .filter((s) => !!s.trim())
          .map((s) => s.split(",").filter((s) => !!s.trim()));
        const maxDimensions = dataSplit.reduce(
          (prev, curr) => Math.max(prev, curr.length - 1),
          0
        );
        return Array.from(Array(maxDimensions).keys()).map((i) => ({
          label: labelSplit[i] || d.label,
          data: dataSplit.map((s) => [
            parseAxis[bottomType](s[0], dateFormat),
            parseAxis[leftType](s[i + 1] || ""),
          ]),
        }));
      }),
    [data, bottomType, leftType, dateFormat]
  );
  const axes = React.useMemo(
    () => [
      { primary: true, type: bottomType, position: "bottom" },
      { type: leftType as AxisType, position: "left" },
    ],
    [leftType, bottomType]
  );
  const series = React.useMemo(() => ({ type }), []);

  return (
    <div className={CHARTS_WRAPPER}>
      <EditContainer blockId={blockId} className={CHART_WRAPPER}>
        <Chart data={chartData} axes={axes} series={series} />
      </EditContainer>
      <div className={LEGEND_WRAPPER}>
        <Label>
          X Axis Type
          <MenuItemSelect
            items={["linear", "ordinal", "time"]}
            onItemSelect={(item) => setBottomType(item)}
            activeItem={bottomType}
          />
        </Label>
        {bottomType === "time" && (
          <Label>
            Date Format
            <InputGroup
              value={dateFormat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDateFormat(e.target.value)
              }
            />
          </Label>
        )}
        <Label>
          Y Axis Type
          <MenuItemSelect
            items={["linear", "ordinal"]}
            onItemSelect={(item) => setLeftType(item)}
            activeItem={leftType}
          />
        </Label>
        <Card elevation={Elevation.TWO}>
          <H6>Legend</H6>
          {chartData.map(({ label }, i) => (
            <p key={i}>
              {label}{" "}
              <Icon icon={"layout-linear"} color={defaultColorScheme[i]} />
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
};

export const renderLineChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}): void =>
  ReactDOM.render(
    <Charts type={"line"} {...getProps(blockId)} blockId={blockId} />,
    parent
  );

export const renderBarChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}): void =>
  ReactDOM.render(<Charts type={"bar"} {...getProps(blockId)} />, parent);

export default Charts;
