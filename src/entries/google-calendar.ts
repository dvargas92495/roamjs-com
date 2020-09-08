import {
  addButtonListener,
  asyncType,
  pushBullets,
  getConfigFromPage,
} from "../entry-helpers";

const GOOGLE_COMMAND = "Import Google Calendar";

declare global {
  interface Window {
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
  }
}

const importGoogleCalendar = async () => {
  const config = getConfigFromPage("google-calendar");

  const calendarId = config["Google Calendar"]?.trim();
  if (!calendarId) {
    await asyncType(
      `Error: Could not find the required "Google Calendar" attribute configured in the [[roam/js/google-calendar]] page.`
    );
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

  const googleFetch =
    config["Oauth"]?.trim() === "true"
      ? fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`
        )
      : fetch(
          `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/google-calendar?calendarId=${calendarId}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`
        );
  googleFetch.then((r) => {
    if (!r.ok) {
      return r
        .text()
        .then((errorMessage) =>
          errorMessage === "Request failed with status code 404"
            ? asyncType(
                `Error for calendar ${calendarId}: Could not find calendar or it's not public. For more information on how to make it public, [visit this page](https://roam.davidvargas.me/extensions/google-calendar)`
              )
            : asyncType(`Error for calendar ${calendarId}: ${errorMessage}`)
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
      await pushBullets(bullets);
    });
  });
};

addButtonListener(GOOGLE_COMMAND, importGoogleCalendar);
