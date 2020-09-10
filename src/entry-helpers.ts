import userEvent from "@testing-library/user-event";
import { waitFor, fireEvent, wait } from "@testing-library/dom";

// @ts-ignore
window.userEvent = userEvent;
export const asyncType = async (text: string) => {
  console.log(text);
  console.log(text.replace(/\./g,"\."));
  return await userEvent.type(document.activeElement, text.replace(/\./g,"PERIOD"), {
    skipClick: true,
  });
}

export const waitForCallback = (text: string) => () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  if (textArea.value.toUpperCase() !== text.toUpperCase()) {
    throw new Error("Typing not complete");
  }
};

export const skipFrame = () => wait(() => {}, {timeout:1});

export const getConfigFromPage = (page: string) => {
  const pageResults = window.roamAlphaAPI.q(
    `[:find (pull ?e [*]) :where [?e :node/title "roam/js/${page}"] ]`
  );
  if (pageResults.length === 0) {
    return {};
  }

  const configurationAttrRefs = pageResults[0][0].attrs.map(
    (a: any) => a[2].source[1]
  );
  const entries = configurationAttrRefs.map((r: string) =>
    window.roamAlphaAPI
      .q(
        `[:find (pull ?e [:block/string]) :where [?e :block/uid "${r}"] ]`
      )[0][0]
      .string.split("::")
  );
  return Object.fromEntries(entries);
};

export const pushBullets = async (bullets: string[]) => {
  for (const index in bullets) {
    const bullet = bullets[index];
    await asyncType(bullet);
    await waitFor(waitForCallback(bullet));

    // Need to switch to fireEvent because user-event enters a newline when hitting enter in a text area
    // https://github.com/testing-library/user-event/blob/master/src/type.js#L505
    const enterObj = {
      key: "Enter",
      keyCode: 13,
      which: 13,
    };
    await fireEvent.keyDown(document.activeElement, enterObj);
    await fireEvent.keyPress(document.activeElement, enterObj);
    await fireEvent.keyUp(document.activeElement, enterObj);
    await waitFor(waitForCallback(""));
  }
};

const clickEventListener = (
  targetCommand: string,
  callback: (buttonConfig?: { [key: string]: string }) => void
) => async (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText
      .toUpperCase()
      .trim()
      .startsWith(targetCommand.toUpperCase())
  ) {
    const rawParts = target.innerText
      .substring(targetCommand.length + 1)
      .split(" ");
    let quotedWord = "";
    const restOfButtonText: string[] = [];
    for (var i = 0; i < rawParts.length; i++) {
      if (quotedWord) {
        if (rawParts[i].endsWith('"')) {
          restOfButtonText.push(`${quotedWord} ${rawParts[i].substring(
            0,
            rawParts[i].length - 1
          )}`);
          quotedWord = '';
        } else {
          quotedWord = `${quotedWord} ${rawParts[i]}`;
        }
      } else {
        if (rawParts[i].startsWith('"')) {
          quotedWord = rawParts[i].substring(1);
        } else {
          restOfButtonText.push(rawParts[i]);
        }
      }
    }

    const numPairs = Math.floor(restOfButtonText.length / 2);
    const buttonConfig = {} as { [key: string]: string };
    for (var i = 0; i < numPairs; i++) {
      buttonConfig[restOfButtonText[i * 2]] = restOfButtonText[i * 2 + 1];
    }

    const divContainer = target.parentElement.parentElement
      .parentElement as HTMLDivElement;
    await userEvent.click(divContainer);
    await waitFor(waitForCallback(`{{${target.innerText}}}`));
    const textArea = document.activeElement as HTMLTextAreaElement;
    await userEvent.clear(textArea);
    await waitFor(waitForCallback(""));
    callback(buttonConfig);
  }
};

export const addButtonListener = (
  targetCommand: string,
  callback: (buttonConfig?: { [key: string]: string }) => void
) => {
  const listener = clickEventListener(targetCommand, callback);
  document.addEventListener("click", listener);
};
