import { fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

const GOOGLE_COMMAND = "Import Google Calendar";

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}

const asyncType = async (text: string) =>
  await userEvent.type(document.activeElement, text, {
    skipClick: true,
  });

const waitForCallback = (text: string) => () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  if (textArea.value.toUpperCase() !== text.toUpperCase()) {
    throw new Error("Typing not complete");
  }
};

const importGoogleCalendar = () => {
  const configurationAttrRefs = window.roamAlphaAPI
  .q(
    '[:find (pull ?e [*]) :where [?e :node/title "roam/js/google-calendar"] ]'
  )[0][0]
  .attrs.map((a: any) => a[2].source[1]);
const entries = configurationAttrRefs.map((r: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?e [:block/string]) :where [?e :block/uid "${r}"] ]`
    )[0][0]
    .string.split("::")
);
const config = Object.fromEntries(entries);

const calendarId = config["Google Calendar"];
if (!calendarId) {
  console.warn("Could not find calendar ID!");
  return;
}
const includeLink = config["Include Event Link"] === 'true';
const timeMin = new Date();
const timeMax = new Date();
const offset = timeMin.getTimezoneOffset() / 60;
timeMin.setHours(-offset, 0, 0, 0);
timeMax.setHours(-offset, 0, 0, 0);
timeMax.setDate(timeMax.getDate() + 1);
const offsetString =
  offset === 0 ? "Z" : `-${offset < 10 ? `0${offset}` : offset}:00`;
const timeMinParam = `${timeMin
  .toISOString()
  .substring(0, timeMin.toISOString().length - 1)}${offsetString}`;
const timeMaxParam = `${timeMax
  .toISOString()
  .substring(0, timeMin.toISOString().length - 1)}${offsetString}`;

fetch(
  `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/google-calendar?calendarId=${calendarId}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`
)
  .then((r) => r.json())
  .then(async (r) => {
    const events = r.items;
    const bullets = events.map((e: any) => {
      const summary = includeLink && e.htmlLink ? `[${e.summary}](${e.htmlLink})` : e.summary;
      const meetLink = e.hangoutLink ? ` - [Meet](${e.hangoutLink})` : "";
      const zoomLink =
        e.location && e.location.indexOf("zoom.us") > -1
          ? ` - [Zoom](${e.location})`
          : "";
      return `${summary} (${new Date(
        e.start.dateTime
      ).toLocaleTimeString()} - ${new Date(
        e.end.dateTime
      ).toLocaleTimeString()})${meetLink}${zoomLink}`;
    }) as string[];
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
    return 0;
  });
}

const slashEventListener = async (e: KeyboardEvent) => {
  if (e.key !== "Enter") {
    return;
  }
  const target = e.target as HTMLElement;
  const elementBeforeEnter = target?.parentElement?.parentElement?.parentElement
    ?.parentElement?.previousElementSibling as HTMLElement;
  const initialValue = elementBeforeEnter?.innerText;
  if (initialValue && initialValue.endsWith(`/${GOOGLE_COMMAND}`)) {
    userEvent.type(target, "{backspace}");
    const textArea = document.activeElement as HTMLTextAreaElement;
    textArea.setSelectionRange(
      initialValue.length - GOOGLE_COMMAND.length - 1,
      initialValue.length
    );
    await asyncType("{backspace}");
    await waitFor(waitForCallback(""));
    importGoogleCalendar();
  }
};

const clickEventListener = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText.toUpperCase() === GOOGLE_COMMAND.toUpperCase()
  ) {
    const divContainer = target.parentElement.parentElement.parentElement as HTMLDivElement;
    await userEvent.click(divContainer);
    await waitFor(waitForCallback(`{{${GOOGLE_COMMAND}}}`));
    const textArea = document.activeElement as HTMLTextAreaElement;
    await userEvent.clear(textArea);
    await waitFor(waitForCallback(""));
    importGoogleCalendar();
  }
}

document.addEventListener("keyup", slashEventListener);

document.addEventListener("click", clickEventListener);