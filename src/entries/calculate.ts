import {
  createButtonObserver,
  extractTag,
  getConfigFromPage,
  getTextByBlockUid,
  getUidsFromButton,
  parseRoamDate,
  toRoamDate,
} from "roam-client";
import {
  DAILY_NOTE_PAGE_REGEX,
  getAttributeValueFromPage,
  getTitlesReferencingPagesInSameBlockTree,
  runExtension,
} from "../entry-helpers";
import differenceInDays from "date-fns/differenceInDays";
import { Parser, Grammar } from "nearley";
import grammar from "../grammars/calculate.ne";
import { subDays } from "date-fns";

const attribute = "calculator";
const shortcut = "calculate";

type Expression = {
  operation:
    | "+"
    | "-"
    | "/"
    | "*"
    | "daily"
    | "max"
    | "since"
    | "attr"
    | "value";
  children: Expression[];
  value: string;
};

const parseExpression = (input: string): Expression => {
  const parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(input);
  return parser.results[0];
};

const DELIM = " , ";

const calculateExpression = (expression: Expression): string => {
  const args = expression.children
    .flatMap((c) => calculateExpression(c).split(DELIM))
    .filter((a) => !!a);

  switch (expression.operation) {
    case "+":
      return args
        .reduce((total, current) => total + parseInt(current), 0)
        .toString();
    case "-":
      return args.slice(1).reduce((total, current) => {
        if (DAILY_NOTE_PAGE_REGEX.test(total)) {
          const totalDate = parseRoamDate(extractTag(total));
          if (DAILY_NOTE_PAGE_REGEX.test(current)) {
            return Math.abs(
              differenceInDays(totalDate, parseRoamDate(extractTag(current)))
            ).toString();
          } else {
            return toRoamDate(subDays(totalDate, parseInt(current)));
          }
        }
        return (parseInt(total) - parseInt(current)).toString();
      }, args[0]);
    case "*":
      return args
        .reduce((total, current) => total * parseInt(current), 1)
        .toString();
    case "/":
      return args
        .slice(1)
        .reduce(
          (total, current) => total / parseInt(current),
          parseInt(args[0])
        )
        .toString();
    case "daily":
      return getTitlesReferencingPagesInSameBlockTree(args)
        .filter((t) => DAILY_NOTE_PAGE_REGEX.test(t))
        .join(DELIM);
    case "max":
      return args.every((s) => DAILY_NOTE_PAGE_REGEX.test(s))
        ? toRoamDate(
            new Date(Math.max(...args.map((s) => parseRoamDate(s).valueOf())))
          )
        : Math.max(...args.map((s) => parseInt(s))).toString();
    case "since":
      return args.length
        ? differenceInDays(new Date(), parseRoamDate(args[0])).toString()
        : "0";
    case "attr":
      return calculateExpression(
        parseExpression(getConfigFromPage(args[0])[args[1]] || "0")
      );
    case "value":
      return expression.value.toString();
    default:
      return "";
  }
};

const getCalculateText = (button: HTMLButtonElement) => {
  const table = button.closest(".roam-table");
  if (table) {
    const trs = Array.from(table.getElementsByTagName("tr"));
    const targetTr = trs.find((tr) => tr.contains(button));
    const pageName = targetTr.firstElementChild.textContent;
    const columnIndex = Array.from(
      targetTr.getElementsByTagName("td")
    ).findIndex((td) => td.contains(button));
    const targetTh = table.getElementsByTagName("th")[columnIndex];
    const attributeName =
      targetTh.childNodes[0].nodeValue ||
      (targetTh.children[0] as HTMLElement).innerText;
    return getAttributeValueFromPage({
      pageName,
      attributeName,
    });
  }
  const { blockUid } = getUidsFromButton(button);
  return getTextByBlockUid(blockUid);
};

runExtension("calculate", () => {
  createButtonObserver({
    attribute,
    shortcut,
    render: (button: HTMLButtonElement) => {
      const text = getCalculateText(button);
      const buttonText =
        text.match(
          new RegExp(`{{(${attribute}|${shortcut}):(.*)}}`, "is")
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
