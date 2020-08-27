import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

const SLASH_COMMAND = "/Import Google Calendar";

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
    const blocks = Array.from(document.getElementsByClassName("roam-block"));
    const calendarBlock = blocks.find((b) => {
      const blockSpan = b.children[0];
      if (!blockSpan) {
        return false;
      }
      return (
        blockSpan.childNodes.length === 2 &&
        blockSpan.children[0].tagName === "STRONG" &&
        blockSpan.children[0].innerHTML.toUpperCase() === "GOOGLE CALENDAR:"
      );
    });
    const calendarId = calendarBlock.children[0].childNodes[1].nodeValue;
    if (!calendarId) {
      console.warn("Could not find calendar ID!");
      return;
    }
    const apiBlock = blocks.find((b) => {
      const blockSpan = b.children[0];
      if (!blockSpan) {
        return false;
      }
      return (
        blockSpan.childNodes.length === 2 &&
        blockSpan.children[0].tagName === "STRONG" &&
        blockSpan.children[0].innerHTML.toUpperCase() === "API KEY:"
      );
    });
    const apiKey = apiBlock.children[0].childNodes[1].nodeValue;
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
      )}/events?key=${apiKey}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`
    )
      .then((r) => r.json())
      .then(async (r) => {
        const events = r.items;
        console.log(events);
        const bullets = events
          .filter((e: any) => e.status !== "cancelled")
          .sort((t1: any, t2: any) => t1.start.dateTime - t2.start.dateTime)
          .map(
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
            delay: 5,
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
        }
        return 0;
      });
  }
};
// @ts-ignore
window.fireEvent = fireEvent;
document.addEventListener("keyup", slashEventListener);
