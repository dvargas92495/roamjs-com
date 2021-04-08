import {
  Button,
  Card,
  Checkbox,
  Icon,
  InputGroup,
  Label,
  NumericInput,
  Switch,
  Tab,
  Tabs,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useMemo, useState } from "react";
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
import ExternalLogin, { ExternalLoginOptions } from "./ExternalLogin";
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

type FlagField = {
  type: "flag";
  defaultValue?: boolean;
};

type MultiTextField = {
  type: "multitext";
  defaultValue?: string[];
};

type PagesField = {
  type: "pages";
  defaultValue?: string[];
};

type OauthField = {
  type: "oauth";
  defaultValue?: [];
  options: ExternalLoginOptions;
};

type ArrayField = PagesField | MultiTextField;
type UnionField = ArrayField | TextField | NumberField | OauthField | FlagField;

type Field<T extends UnionField> = T & {
  title: string;
  description: string;
};

type FieldPanel<T extends UnionField, U = Record<string, unknown>> = (
  props: {
    order: number;
    uid?: string;
    parentUid: string;
  } & Omit<Field<T>, "type"> &
    U
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
        const newUid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          block: { string: title, uid: newUid },
          location: { order, "parent-uid": parentUid },
        });
        setTimeout(() => setUid(newUid));
        const newValueUid = window.roamAlphaAPI.util.generateUID();
        window.roamAlphaAPI.createBlock({
          block: { string: `${v}`, uid: newValueUid },
          location: { order: 0, "parent-uid": newUid },
        });
        setValueUid(newValueUid);
      }
    },
    [setValue, setValueUid, title, parentUid, order, uid, setUid]
  );
  return { value, onChange };
};

const MultiChildPanel: FieldPanel<
  ArrayField,
  {
    InputComponent: (props: {
      value: string;
      setValue: (s: string) => void;
    }) => React.ReactElement;
  }
> = ({
  uid: initialUid,
  title,
  description,
  order,
  parentUid,
  InputComponent,
}) => {
  const [uid, setUid] = useState(initialUid);
  const [texts, setTexts] = useState(() =>
    uid
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
          <InputComponent value={value} setValue={setValue} />
          <Button
            icon={"plus"}
            minimal
            disabled={!value}
            onClick={() => {
              const valueUid = window.roamAlphaAPI.util.generateUID();
              if (uid) {
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": uid, order: texts.length },
                  block: { string: value, uid: valueUid },
                });
              } else {
                const newUid = window.roamAlphaAPI.util.generateUID();
                window.roamAlphaAPI.createBlock({
                  block: { string: title, uid: newUid },
                  location: { order, "parent-uid": parentUid },
                });
                setTimeout(() => setUid(newUid));
                window.roamAlphaAPI.createBlock({
                  block: { string: value, uid: valueUid },
                  location: { order: 0, "parent-uid": newUid },
                });
              }
              setTexts([...texts, { text: value, uid: valueUid }]);
              setValue("");
            }}
          />
        </div>
      </Label>
      {texts.map((p) => (
        <div
          key={p.uid}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {p.text}
          </span>
          <Button
            icon={"trash"}
            minimal
            onClick={() => {
              window.roamAlphaAPI.deleteBlock({ block: { uid: p.uid } });
              setTexts(texts.filter((f) => f.uid !== p.uid));
            }}
          />
        </div>
      ))}
    </>
  );
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

const FlagPanel: FieldPanel<FlagField> = ({
  title,
  uid: initialUid,
  parentUid,
  order,
  description,
}) => {
  const [uid, setUid] = useState(initialUid);
  return (
    <Checkbox
      checked={!!uid}
      onChange={(e) => {
        if ((e.target as HTMLInputElement).checked) {
          const newUid = window.roamAlphaAPI.util.generateUID();
          window.roamAlphaAPI.createBlock({
            block: { string: title, uid: newUid },
            location: { order, "parent-uid": parentUid },
          });
          setTimeout(() => setUid(newUid), 1);
        } else {
          window.roamAlphaAPI.deleteBlock({ block: { uid } });
          setUid("");
        }
      }}
      labelElement={
        <>
          {title}
          <Description description={description} />{" "}
        </>
      }
    />
  );
};

const MultiTextPanel: FieldPanel<MultiTextField> = (props) => {
  return (
    <MultiChildPanel
      {...props}
      InputComponent={({ value, setValue }) => (
        <InputGroup value={value} onChange={(e) => setValue(e.target.value)} />
      )}
    />
  );
};

const PagesPanel: FieldPanel<PagesField> = (props) => {
  return (
    <MultiChildPanel
      {...props}
      InputComponent={(inputProps) => (
        <PageInput extra={["{all}"]} {...inputProps} />
      )}
    />
  );
};

const OauthPanel: FieldPanel<OauthField> = ({
  uid,
  parentUid,
  description,
  options,
}) => {
  const [accounts, setAccounts] = useState(() =>
    uid
      ? getTreeByBlockUid(uid).children.map((v) => ({
          text: v.text,
          uid: v.uid,
        }))
      : []
  );
  return (
    <>
      {!accounts.length && (
        <>
          <Label>
            Log In
            <Description description={description} />
          </Label>
          <ExternalLogin
            onSuccess={(acc) => setAccounts([...accounts, acc])}
            parentUid={parentUid}
            {...options}
          />
        </>
      )}
      {!!accounts.length && <span>Successfully logged in</span>}
    </>
  );
};

const Panels = {
  text: TextPanel,
  number: NumberPanel,
  flag: FlagPanel,
  pages: PagesPanel,
  oauth: OauthPanel,
  multitext: MultiTextPanel,
} as { [UField in UnionField as UField["type"]]: FieldPanel<UField> };

type ConfigTab = {
  id: string;
  toggleable?: boolean;
  fields: Field<UnionField>[];
};

type Config = {
  tabs: ConfigTab[];
};

const FieldTabs = ({
  id,
  fields,
  uid: initialUid,
  pageUid,
  order,
  toggleable,
}: {
  uid: string;
  pageUid: string;
  order: number;
} & ConfigTab) => {
  const [uid, setUid] = useState(initialUid);
  const subTree = useMemo(() => (uid ? getTreeByBlockUid(uid) : undefined), [
    uid,
  ]);
  const [parentUid, parentTree] = useMemo(
    () =>
      /home/i.test(id)
        ? [pageUid, getTreeByBlockUid(pageUid).children]
        : [
            subTree?.uid ||
              (toggleable
                ? ""
                : createBlock({
                    parentUid: pageUid,
                    order,
                    node: { text: id },
                  })),
            subTree?.children || [],
          ],
    [uid, subTree, id, toggleable]
  );
  const [enabled, setEnabled] = useState(!toggleable || !!parentUid);
  const [selectedTabId, setSelectedTabId] = useState(
    enabled ? fields[0].title : "enabled"
  );
  const onTabsChange = useCallback((tabId: string) => setSelectedTabId(tabId), [
    setSelectedTabId,
  ]);
  return (
    <Tabs
      vertical
      id={`${id}-field-tabs`}
      onChange={onTabsChange}
      selectedTabId={selectedTabId}
      renderActiveTabPanelOnly
    >
      {toggleable && (
        <Tab
          id={"enabled"}
          title={"enabled"}
          panel={
            <Switch
              labelElement={"Enabled"}
              checked={enabled}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setEnabled(checked);
                if (checked) {
                  const newUid = window.roamAlphaAPI.util.generateUID();
                  window.roamAlphaAPI.createBlock({
                    location: { "parent-uid": pageUid, order },
                    block: { string: id, uid: newUid },
                  });
                  setTimeout(() => setUid(newUid));
                } else {
                  window.roamAlphaAPI.deleteBlock({ block: { uid } });
                  setUid("");
                }
              }}
            />
          }
        />
      )}
      {fields.map((field, i) => {
        const { type, title, defaultValue } = field;
        const Panel = Panels[type];
        return (
          <Tab
            id={title}
            key={title}
            title={title}
            disabled={!enabled}
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
  const tree = getTreeByPageName(`roam/js/${id}`);
  return (
    <Card>
      <h4 style={{ padding: 4 }}>{toTitle(id)} Configuration</h4>
      <Tabs
        vertical
        id={`${id}-config-tabs`}
        onChange={onTabsChange}
        selectedTabId={selectedTabId}
      >
        {config.tabs.map(({ id: tabId, fields, toggleable }, i) => (
          <Tab
            id={tabId}
            key={tabId}
            title={tabId}
            panel={
              <FieldTabs
                id={tabId}
                fields={fields}
                uid={tree.find((t) => new RegExp(tabId, "i").test(t.text))?.uid}
                pageUid={pageUid}
                order={i}
                toggleable={!!toggleable}
              />
            }
          />
        ))}
      </Tabs>
    </Card>
  );
};

const fieldsToChildren = (t: ConfigTab) =>
  t.fields
    .filter((f) => !!f.defaultValue)
    .map((f) => ({
      text: f.title,
      children: !f.defaultValue
        ? []
        : f.type === "pages"
        ? f.defaultValue.map((v) => ({ text: v }))
        : [{ text: `${f.defaultValue}` }],
    }));

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
      tree: [
        ...(config.tabs.some((t) => /home/i.test(t.id))
          ? fieldsToChildren(config.tabs.find((t) => /home/i.test(t.id)))
          : []),
        ...config.tabs
          .filter((t) => !/home/i.test(t.id) && !t.toggleable)
          .map((t) => ({
            text: t.id,
            children: fieldsToChildren(t),
          })),
      ],
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
