import {
  Button,
  Card,
  Icon,
  InputGroup,
  Label,
  NumericInput,
  Tab,
  Tabs,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  createPage,
  getPageUidByPageTitle,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
} from "roam-client";
import {
  createHTMLObserver,
  getFirstChildUidByBlockUid,
} from "../entry-helpers";
import { toTitle } from "./hooks";
import PageInput from "./PageInput";

type TextField = {
  type: "text";
  defaultValue?: string;
};

type NumberField = {
  type: "number";
  defaultValue?: number;
};

type PagesField = {
  type: "pages";
  defaultValue?: string[];
};

type UnionField = PagesField | TextField | NumberField;

type Field<T extends UnionField> = T & {
  title: string;
  description: string;
};

type FieldPanel<T extends UnionField> = (
  props: {
    order: number;
    uid?: string;
    parentUid: string;
  } & Omit<Field<T>, "type">
) => React.ReactElement;

const Description = ({ description }: { description: string }) => {
  return (
    <span
      style={{
        marginLeft: 12,
        display: "inline-block",
        opacity: 0.8,
        verticalAlign: "text-bottom",
      }}
    >
      <Tooltip
        content={
          <span style={{ maxWidth: 400, display: "inline-block" }}>
            {description}
          </span>
        }
      >
        <Icon icon={"info-sign"} iconSize={12} />
      </Tooltip>
    </span>
  );
};

const useSingleChildValue = <T extends string | number>({
  defaultValue,
  uid: initialUid,
  title,
  parentUid,
  order,
  transform,
}: {
  title: string;
  parentUid: string;
  order: number;
  uid: string;
  defaultValue: T;
  transform: (s: string) => T;
}): { value: T; onChange: (v: T) => void } => {
  const [uid, setUid] = useState(initialUid);
  const [valueUid, setValueUid] = useState(
    uid && getFirstChildUidByBlockUid(uid)
  );
  const [value, setValue] = useState(
    (uid && transform(getTextByBlockUid(valueUid))) || defaultValue
  );
  const onChange = useCallback(
    (v: T) => {
      setValue(v);
      if (valueUid) {
        window.roamAlphaAPI.updateBlock({
          block: { string: `${v}`, uid: valueUid },
        });
      } else if (uid) {
        const newValueUid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          block: { string: `${v}`, uid: newValueUid },
          location: { order: 0, "parent-uid": uid },
        });
        setValueUid(newValueUid);
      } else {
        const fieldUid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          block: { string: title, uid: fieldUid },
          location: { order, "parent-uid": parentUid },
        });
        setUid(fieldUid);
        const newValueUid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          block: { string: `${v}`, uid: newValueUid },
          location: { order: 0, "parent-uid": fieldUid },
        });
        setValueUid(newValueUid);
      }
    },
    [setValue, setValueUid, title, parentUid, order, uid, setUid]
  );
  return { value, onChange };
};

const TextPanel: FieldPanel<TextField> = ({
  title,
  uid,
  parentUid,
  order,
  description,
  defaultValue = "",
}) => {
  const { value, onChange } = useSingleChildValue({
    defaultValue,
    title,
    uid,
    parentUid,
    order,
    transform: (s) => s,
  });
  return (
    <Label>
      {title}
      <Description description={description} />
      <InputGroup
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
    </Label>
  );
};

const NumberPanel: FieldPanel<NumberField> = ({
  title,
  uid,
  parentUid,
  order,
  description,
  defaultValue = 0,
}) => {
  const { value, onChange } = useSingleChildValue({
    defaultValue,
    title,
    uid,
    parentUid,
    order,
    transform: parseInt,
  });
  return (
    <Label>
      {title}
      <Description description={description} />
      <NumericInput value={value} onValueChange={onChange} />
    </Label>
  );
};

const PagesPanel: FieldPanel<PagesField> = ({
  uid: initialUid,
  title,
  parentUid,
  order,
  description,
}) => {
  const [uid, setUid] = useState(initialUid);
  const [pages, setPages] = useState(
    () => uid
      ? getTreeByBlockUid(uid).children.map((v) => ({
          text: v.text,
          uid: v.uid,
        }))
      : []
  );
  const [value, setValue] = useState("");
  return (
    <>
      <Label>
        {title}
        <Description description={description} />
        <div style={{ display: "flex" }}>
          <PageInput value={value} setValue={setValue} extra={["{all}"]} />
          <Button
            icon={"plus"}
            minimal
            disabled={!value}
            onClick={() => {
              const valueUid = window.roamAlphaAPI.util.generateUID();
              if (uid) {
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": uid, order: pages.length },
                  block: { string: value, uid: valueUid },
                });
              } else {
                const fieldUid = window.roamAlphaAPI.util.generateUID();
                window.roamAlphaAPI.createBlock({
                  block: { string: title, uid: fieldUid },
                  location: { order, "parent-uid": parentUid },
                });
                setUid(fieldUid);
                window.roamAlphaAPI.createBlock({
                  block: { string: value, uid: valueUid },
                  location: { order: 0, "parent-uid": fieldUid },
                });
              }
              setPages([...pages, { text: value, uid: valueUid }]);
              setValue("");
            }}
          />
        </div>
      </Label>
      {pages.map((p) => (
        <div
          key={p.uid}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {p.text}
          <Button
            icon={"trash"}
            minimal
            onClick={() => {
              window.roamAlphaAPI.deleteBlock({ block: { uid: p.uid } });
              setPages(pages.filter((f) => f.uid !== p.uid));
            }}
          />
        </div>
      ))}
    </>
  );
};

const Panels = {
  text: TextPanel,
  number: NumberPanel,
  pages: PagesPanel,
} as { [UField in UnionField as UField["type"]]: FieldPanel<UField> };

type ConfigTab = {
  id: string;
  fields: Field<UnionField>[];
};

type Config = {
  tabs: ConfigTab[];
};

const FieldTabs = ({
  id,
  fields,
  extensionId,
  pageUid,
  order,
}: {
  extensionId: string;
  pageUid: string;
  order: number;
} & ConfigTab) => {
  const [selectedTabId, setSelectedTabId] = useState(fields[0].title);
  const onTabsChange = useCallback((tabId: string) => setSelectedTabId(tabId), [
    setSelectedTabId,
  ]);
  const tree = getTreeByPageName(`roam/js/${extensionId}`);
  const subTree = tree.find((t) => new RegExp(id, "i").test(t.text));
  const [parentUid, parentTree] = /home/i.test(id)
    ? [pageUid, tree]
    : [
        subTree?.uid ||
          createBlock({ parentUid: pageUid, order, node: { text: id } }),
        subTree?.children || [],
      ];
  return (
    <Tabs
      vertical
      id={`${id}-field-tabs`}
      onChange={onTabsChange}
      selectedTabId={selectedTabId}
      renderActiveTabPanelOnly
    >
      {fields.map((field, i) => {
        const { type, title, defaultValue } = field;
        const Panel = Panels[type];
        return (
          <Tab
            id={title}
            key={title}
            title={title}
            panel={
              <Panel
                {...field}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore 4.3.0
                defaultValue={defaultValue}
                order={i}
                parentUid={parentUid}
                uid={
                  parentTree.find((t) => new RegExp(title, "i").test(t.text))
                    ?.uid || ""
                }
              />
            }
          />
        );
      })}
    </Tabs>
  );
};

const ConfigPage = ({
  id,
  config,
}: {
  id: string;
  config: Config;
}): React.ReactElement => {
  const [selectedTabId, setSelectedTabId] = useState(config.tabs[0].id);
  const onTabsChange = useCallback((tabId: string) => setSelectedTabId(tabId), [
    setSelectedTabId,
  ]);
  const pageUid = getPageUidByPageTitle(`roam/js/${id}`);
  return (
    <Card>
      <h4 style={{ padding: 4 }}>{toTitle(id)} Configuration</h4>
      <Tabs
        vertical
        id={`${id}-config-tabs`}
        onChange={onTabsChange}
        selectedTabId={selectedTabId}
      >
        {config.tabs.map(({ id: tabId, fields }, i) => (
          <Tab
            id={tabId}
            key={tabId}
            title={tabId}
            panel={
              <FieldTabs
                id={tabId}
                fields={fields}
                extensionId={id}
                pageUid={pageUid}
                order={i}
              />
            }
          />
        ))}
      </Tabs>
    </Card>
  );
};

export const createConfigObserver = ({
  title,
  config,
}: {
  title: string;
  config: Config;
}): void => {
  if (!getPageUidByPageTitle(title)) {
    createPage({
      title,
      tree: config.tabs.map((t) => ({
        text: t.id,
        children: t.fields.map((f) => ({
          text: f.title,
          children: !f.defaultValue
            ? []
            : f.type === "pages"
            ? f.defaultValue.map((v) => ({ text: v }))
            : [{ text: `${f.defaultValue}` }],
        })),
      })),
    });
  }
  createHTMLObserver({
    className: "rm-title-display",
    tag: "H1",
    callback: (d: HTMLHeadingElement) => {
      if (d.innerText === title) {
        const uid = getPageUidByPageTitle(title);
        const attribute = `data-roamjs-${uid}`;
        const containerParent = d.parentElement.parentElement;
        if (!containerParent.hasAttribute(attribute)) {
          containerParent.setAttribute(attribute, "true");
          const parent = document.createElement("div");
          parent.id = `${title.replace("roam/js/", "roamjs-")}-config`;
          containerParent.insertBefore(
            parent,
            d.parentElement.nextElementSibling
          );
          ReactDOM.render(
            <ConfigPage id={title.replace("roam/js/", "")} config={config} />,
            parent
          );
        }
      }
    },
  });
};

export default ConfigPage;
