import {
  Button,
  Card,
  Elevation,
  Label,
  NumericInput,
  Spinner,
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  getPageTitleReferencesByPageTitle,
  getTreeByPageName,
} from "roam-client";
import { extractTag, getRefTitlesByBlockUid } from "../entry-helpers";
import EditContainer from "./EditContainer";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";

type FanoutProps = {
  title: string;
  blockId: string;
};

const getAuthorPayout = (author: string) => {
  const tree = getTreeByPageName(author);
  const payoutNode = tree.find((t) => /payout/i.test(t.text));
  const acctNumberNode = payoutNode.children.find((t) =>
    /account number/i.test(t.text)
  );
  return `***${acctNumberNode.children[0].text.slice(-4)}`;
};

const Fanout: React.FunctionComponent<FanoutProps> = ({ title, blockId }) => {
  const getSubmissions = useCallback(
    () => getPageTitleReferencesByPageTitle(title),
    [title]
  );
  const getPaymentMethods = useCallback(() => {
    const tree = getTreeByPageName(title);
    const organizerNode = tree.find((t) => /organizer/i.test(t.text));
    const organizer = extractTag(organizerNode.children[0].text);

    const organizerTree = getTreeByPageName(organizer);
    const paymentMethodNode = organizerTree.find((t) =>
      /payment methods/i.test(t.text)
    );
    return Object.fromEntries(
      paymentMethodNode.children.map((c) => [
        c.text,
        Object.fromEntries(c.children.map((k) => [k.text, k.children[0].text])),
      ])
    );
  }, [title]);
  const [submissions, setSubmissions] = useState(getSubmissions);
  const [paymentMethods, setPaymentMethods] = useState(getPaymentMethods);
  const [loading, setLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(submissions[0]);
  const [activePaymentMethod, setActivePaymentMethod] = useState(
    Object.keys(paymentMethods)[0]
  );
  const [reward, setReward] = useState(0);
  const [dependencyReward, setDependencyReward] = useState(0);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");
  const refresh = useCallback(() => {
    setSubmissions(getSubmissions());
    setPaymentMethods(getPaymentMethods());
  }, [getSubmissions, setSubmissions, getPaymentMethods, setPaymentMethods]);
  const onClickReward = useCallback(() => {
    setLoading(true);
    setResponse("");
    setError("");
    // Simulating API Call
    setTimeout(() => {
      const tree = getTreeByPageName(title);
      const rewardNode = tree.find((t) => /reward/i.test(t.text));
      const totalReward = parseInt(rewardNode.children[0].text);
      if (reward + dependencyReward !== totalReward) {
        setError("Reward and Dependency Reward must add up to Total Reward");
        setLoading(false);
        return;
      }
      const organizerNode = tree.find((t) => /organizer/i.test(t.text));
      const organizer = extractTag(organizerNode.children[0].text);

      const winners: { [name: string]: number } = {};
      const submissionTree = getTreeByPageName(activeSubmission);
      const authorUid = submissionTree.find((t) =>
        /Fanout Author/i.test(t.text)
      ).uid;
      const author = getRefTitlesByBlockUid(authorUid).find(
        (s) => !/fanout author/i.test(s)
      );
      winners[author] = reward;
      const dependencyNode = submissionTree.find((t) =>
        /dependencies/i.test(t.text)
      );
      if (!dependencyNode) {
        setError("Project needs to set dependencies to receive payout.");
        setLoading(false);
        return;
      }
      const weights = dependencyNode.children.map((c) => {
        const weight = c.children.length ? parseInt(c.children[0].text) : 1;
        const tag = extractTag(c.text);
        const dependencyTree = getTreeByPageName(tag);
        const depAuthorUid = dependencyTree.find((t) =>
          /Fanout Author/i.test(t.text)
        ).uid;
        const depAuthor = getRefTitlesByBlockUid(depAuthorUid).find(
          (s) => !/fanout author/i.test(s)
        );
        return { name: depAuthor, weight };
      });
      const totalWeight = weights.reduce((prev, cur) => prev + cur.weight, 0);
      weights.forEach((w) => {
        if (winners[w.name]) {
          winners[w.name] += (w.weight / totalWeight) * dependencyReward;
        } else {
          winners[w.name] = (w.weight / totalWeight) * dependencyReward;
        }
      });
      setResponse(`${organizer} awarded ${activeSubmission} with $${totalReward}!

$${reward} went to the project itself.
$${dependencyReward} went to the project's dependencies.

${Object.entries(winners)
  .map(
    ([name, reward]) =>
      `${name} was awarded $${reward}, paid out to ${getAuthorPayout(name)}.`
  )
  .join("\n")}
`);
      setLoading(false);
    }, 1000);
  }, [
    setLoading,
    setResponse,
    title,
    activePaymentMethod,
    activeSubmission,
    reward,
    dependencyReward,
  ]);
  const onDocumentClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" && target.className === "bp3-input") {
      target.focus();
    }
  }, []);
  useEffect(() => {
    document.addEventListener("click", onDocumentClick);
    return () => document.addEventListener("click", onDocumentClick);
  }, [onDocumentClick]);
  return (
    <EditContainer blockId={blockId}>
      <Card elevation={Elevation.TWO}>
        <h3>Fanout Reward for {title}</h3>
        <Label>
          Submissions
          <MenuItemSelect
            items={submissions}
            onItemSelect={(item) => setActiveSubmission(item)}
            activeItem={activeSubmission}
          />
        </Label>
        <Label>
          Reward
          <style>
            {`span.bp3-icon.bp3-icon-dollar {
    margin-top: 12px;
}`}
          </style>
          <NumericInput
            leftIcon={"dollar"}
            min={0}
            value={reward}
            onValueChange={setReward}
          />
        </Label>
        <Label>
          Dependency Reward
          <style>
            {`span.bp3-icon.bp3-icon-dollar {
    margin-top: 12px;
}`}
          </style>
          <NumericInput
            leftIcon={"dollar"}
            min={0}
            value={dependencyReward}
            onValueChange={setDependencyReward}
          />
        </Label>
        <Label>
          Payment Method
          <MenuItemSelect
            items={Object.keys(paymentMethods)}
            onItemSelect={(item) => setActivePaymentMethod(item)}
            activeItem={activePaymentMethod}
          />
        </Label>
        <Button text={"Fanout Reward"} onClick={onClickReward} />
        {loading && <Spinner />}
        {error && <div style={{ color: "darkred" }}>{error}</div>}
        {response && (
          <div>
            <h5>Fanout Response:</h5>
            <div style={{ color: "darkgreen" }}>{response}</div>
          </div>
        )}
        <Button
          icon={"refresh"}
          onClick={refresh}
          minimal
          style={{ position: "absolute", top: 8, right: 64 }}
        />
      </Card>
    </EditContainer>
  );
};

export const render = ({
  p,
  ...props
}: { p: HTMLSpanElement } & FanoutProps): void =>
  ReactDOM.render(<Fanout {...props} />, p);
