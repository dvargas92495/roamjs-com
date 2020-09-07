import { fireEvent, waitFor } from "@testing-library/dom";
import { addButtonListener, waitForCallback, asyncType } from "../entry-helpers";

const GOOGLE_COMMAND = "Import Google Calendar";

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}

const importGoogleCalendar = async () => {
  const pageResults = window.roamAlphaAPI.q(
    '[:find (pull ?e [*]) :where [?e :node/title "roam/js/google-calendar"] ]'
  );
  if (pageResults.length === 0) {
    await asyncType(
      "Error: Could not find the [[roam/js/google-calendar]] page. Please add this page and configure the Google Calendar attribute"
    );
    return;
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
  const config = Object.fromEntries(entries);

  const calendarId = config["Google Calendar"]?.trim();
  if (!calendarId) {
    console.warn("Could not find calendar ID!");
    return;
  }
  const includeLink = config["Include Event Link"]?.trim() === "true";
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
  ).then((r) => {
    if (!r.ok) {
      return r.text().then((errorMessage) => 
        asyncType(
          `Error for calendar ${calendarId}: ${errorMessage}`
        )
      );
    }
    return r.json().then(async (r) => {
      const events = r.items;
      if (events.length === 0) {
        await asyncType("No Events Scheduled for Today!");
        return;
      }
      const bullets = events.map((e: any) => {
        const summaryText = e.summary ? e.summary : "No Summary";
        const summary =
          includeLink && e.htmlLink
            ? `[${summaryText}](${e.htmlLink})`
            : summaryText;
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
    });
  });
};

addButtonListener(GOOGLE_COMMAND, importGoogleCalendar);
