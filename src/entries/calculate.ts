import {
  getConfigFromPage,
  getUidsFromButton,
  parseRoamDate,
  toRoamDate,
} from "roam-client";
import {
  createButtonObserver,
  DAILY_NOTE_PAGE_REGEX,
  getTextByBlockUid,
  getTitlesReferencingPagesInSameBlock,
  runExtension,
} from "../entry-helpers";
import differenceInDays from "date-fns/differenceInDays";
import {Parser, Grammar} from "nearley";
import grammar from "../grammars/calculate.ne";

const attribute = "calculator";
const shortcut = "calculate";

type Expression = {
  operation: "*" | "daily" | "max" | "since" | "attr" | "value";
  children: Expression[];
  value: string;
};

const parser = new Parser(Grammar.fromCompiled(grammar));

const parseExpression = (input: string): Expression => {
  parser.feed(input);
  console.log(parser.finish());
  return {
    operation: "*",
    children: [],
    value: "",
  };
};

const calculateExpression = (expression: Expression): string => {
  const args = expression.children.flatMap((c) =>
    calculateExpression(c).split(",")
  );

  switch (expression.operation) {
    case "*":
      return args
        .reduce((total, current) => total * parseInt(current), 1)
        .toString();
    case "daily":
      return getTitlesReferencingPagesInSameBlock(args)
        .map((t) => DAILY_NOTE_PAGE_REGEX.test(t))
        .join(",");
    case "max":
      return args.every((s) => DAILY_NOTE_PAGE_REGEX.test(s))
        ? toRoamDate(
            new Date(Math.max(...args.map((s) => parseRoamDate(s).valueOf())))
          )
        : Math.max(...args.map((s) => parseInt(s))).toString();
    case "since":
      return differenceInDays(new Date(), parseRoamDate(args[0])).toString();
    case "attr":
      return calculateExpression(
        parseExpression(getConfigFromPage(args[0])[args[1]])
      );
    case "value":
      return expression.value;
    default:
      return "";
  }
};

runExtension("calculate", () => {
  createButtonObserver({
    attribute,
    shortcut,
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      const text = getTextByBlockUid(blockUid);
      const buttonText =
        text.match(
          new RegExp(`{{(${attribute}|${shortcut}):(.*)}}$`, "is")
        )?.[2] || "";
      if (buttonText) {
        const expression = parseExpression(buttonText.trim());
        const value = calculateExpression(expression);
        const parentSpan = button.parentElement as HTMLSpanElement;
        parentSpan.removeChild(button);
        parentSpan.className = "dont-focus-block rm-calc-val";
        parentSpan.style.cursor = "pointer";
        parentSpan.innerText = value;
      }
    },
  });
});
