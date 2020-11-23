import { createCustomSmartBlockCommand, getPageTitle, runExtension } from "../entry-helpers";
import {
  addButtonListener,
  asyncType,
  genericError,
  pushBullets,
  getConfigFromPage,
  parseRoamDate,
} from "roam-client";
import axios from "axios";
import { formatRFC3339, startOfDay, endOfDay } from "date-fns";

const GOOGLE_COMMAND = "Import Google Calendar";

const importGoogleCalendar = async (
  _: any,
  blockUid: string,
  parentUid: string
) => {
  const config = getConfigFromPage("roam/js/google-calendar");
  const pageTitle = getPageTitle(document.activeElement);
  const dateFromPage = parseRoamDate(pageTitle.textContent);

  const calendarId = config["Google Calendar"]?.trim();
  if (!calendarId) {
    await asyncType(
      `Error: Could not find the required "Google Calendar" attribute configured in the [[roam/js/google-calendar]] page.`
    );
    return;
  }
  const includeLink = config["Include Event Link"]?.trim() === "true";
  const skipFree = config["Skip Free"]?.trim() === "true";
  const format = config["Format"];
  const dateToUse = isNaN(dateFromPage.valueOf()) ? new Date() : dateFromPage;
  const timeMin = startOfDay(dateToUse);
  const timeMax = endOfDay(timeMin);
  const timeMinParam = encodeURIComponent(formatRFC3339(timeMin));
  const timeMaxParam = encodeURIComponent(formatRFC3339(timeMax));

  axios
    .get(
      `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/google-calendar?calendarId=${encodeURIComponent(
        calendarId
      )}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`
    )
    .then(async (r) => {
      const events = r.data.items;
      if (!events || events.length === 0) {
        await asyncType("No Events Scheduled for Today!");
        return;
      }
      const bullets = events
        .filter((e: any) => !skipFree || e.transparency !== "transparent")
        .map((e: any) => {
          if (format) {
            return format
              .replace("/Summary", e.summary || "No Summary")
              .replace("/Link", e.htmlLink || "")
              .replace("/Hangout", e.hangoutLink || "")
              .replace("/Location", e.location || "")
              .replace(
                "/Start Time",
                new Date(e.start.dateTime).toLocaleTimeString()
              )
              .replace(
                "/End Time",
                new Date(e.end.dateTime).toLocaleTimeString()
              );
          } else {
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
          }
        }) as string[];
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch((e) =>
      e.message === "Request failed with status code 404"
        ? asyncType(
            `Error for calendar ${calendarId}: Could not find calendar or it's not public. For more information on how to make it public, [visit this page](https://roamjs.com/extensions/google-calendar)`
          )
        : genericError(e)
    );
};

runExtension("google-calendar", () => {
  addButtonListener(GOOGLE_COMMAND, importGoogleCalendar);
});

createCustomSmartBlockCommand({
  command: 'GOOGLECALENDAR',
  value: importGoogleCalendar
})
