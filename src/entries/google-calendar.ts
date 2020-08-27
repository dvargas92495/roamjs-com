import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

const SLASH_COMMAND = "/Import Google Calendar";

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}

const slashEventListener = (e: KeyboardEvent) => {
  if (e.key !== "Enter") {
    return;
  }
  const target = e.target as HTMLElement;
  const elementBeforeEnter = target.parentElement.parentElement.parentElement
    .parentElement.previousElementSibling as HTMLElement;
  const initialValue = elementBeforeEnter.innerText;
  if (initialValue.endsWith(SLASH_COMMAND)) {
    userEvent.type(target, "{backspace}");
    const configurationAttrRefs = window.roamAlphaAPI
      .q(
        '[:find (pull ?e [*]) :where [?e :node/title "roam/js/google-calendar"] ]'
      )[0][0]
      .map((a: any) => a[2].source[1]);
    const entries = configurationAttrRefs.map((r: string) => window.roamAlphaAPI.q(`[:find (pull ?e [:block/string]) :where [?e :block/uid "${r}"] ]`)[0][0].string.split(":"));
    const config = Object.fromEntries(entries);

    const calendarId = config['Google Calendar'];
    const apiKey = config['API Key'];
    if (!calendarId) {
      console.warn("Could not find calendar ID!");
      return;
    }
    if (!apiKey) {
      console.warn("Could not find API KEY!");
      return;
    }
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
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?key=${apiKey}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}&orderBy=startTime&singleEvents=true`
    )
      .then((r) => r.json())
      .then(async (r) => {
        const events = r.items;
        const bullets = events.map(
          (e: any) =>
            `${e.summary} @ ${new Date(
              e.start.dateTime
            ).toLocaleTimeString()} - ${new Date(
              e.end.dateTime
            ).toLocaleTimeString()}`
        ) as string[];
        const textArea = document.activeElement as HTMLTextAreaElement;
        textArea.setSelectionRange(
          initialValue.length - SLASH_COMMAND.length,
          initialValue.length
        );
        await userEvent.type(textArea, "{backspace}");
        for (const index in bullets) {
          const bullet = bullets[index];
          await userEvent.type(document.activeElement, bullet, {
            delay: 1,
            skipClick: true,
          });

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

          // yolo wait, next character was bleeding
          // https://github.com/testing-library/user-event/blob/a5b335026abe9692a85190180603597da9687496/src/type.js#L57
          await new Promise((resolve) => setTimeout(() => resolve(), 1));
        }
        return 0;
      });
  }
};
// @ts-ignore
window.fireEvent = fireEvent;
document.addEventListener("keyup", slashEventListener);
