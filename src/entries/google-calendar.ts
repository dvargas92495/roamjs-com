import {
  createCustomSmartBlockCommand,
  getPageTitle,
  runExtension,
} from "../entry-helpers";
import {
  addButtonListener,
  genericError,
  pushBullets,
  getConfigFromPage,
  parseRoamDate,
  getParentUidByBlockUid,
} from "roam-client";
import axios from "axios";
import formatRFC3339 from "date-fns/formatRFC3339";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import format from "date-fns/format";

const GOOGLE_COMMAND = "Import Google Calendar";

type Event = {
  transparency: "transparent" | "opaque";
  summary: string;
  htmlLink: string;
  hangoutLink: string;
  location: string;
  start: { dateTime: string };
  end: { dateTime: string };
  visibility: "private" | "public";
};

const EMPTY_MESSAGE = "No Events Scheduled for Today!";
const resolveDate = (d: { dateTime?: string; format?: string }) => {
  if (!d.dateTime) {
    return "All Day";
  }
  const date = new Date(d.dateTime);
  if (d.format) {
    return format(date, d.format);
  } else {
    return date.toLocaleTimeString();
  }
};

const resolveSummary = (e: Event) =>
  e.visibility === "private" ? "busy" : e.summary || "No Summary";

const fetchGoogleCalendar = async (): Promise<string[]> => {
  const config = getConfigFromPage("roam/js/google-calendar");
  const pageTitle = getPageTitle(document.activeElement);
  const dateFromPage = parseRoamDate(pageTitle.textContent);

  const calendarId = config["Google Calendar"]?.trim();
  if (!calendarId) {
    return [
      `Error: Could not find the required "Google Calendar" attribute configured in the [[roam/js/google-calendar]] page.`,
    ];
  }
  const includeLink = config["Include Event Link"]?.trim() === "true";
  const skipFree = config["Skip Free"]?.trim() === "true";
  const format = config["Format"];
  const dateToUse = isNaN(dateFromPage.valueOf()) ? new Date() : dateFromPage;
  const timeMin = startOfDay(dateToUse);
  const timeMax = endOfDay(timeMin);
  const timeMinParam = encodeURIComponent(formatRFC3339(timeMin));
  const timeMaxParam = encodeURIComponent(formatRFC3339(timeMax));

  return axios
    .get(
      `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/google-calendar?calendarId=${encodeURIComponent(
        calendarId
      )}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`
    )
    .then(async (r) => {
      const events = r.data.items;
      if (!events || events.length === 0) {
        return [EMPTY_MESSAGE];
      }
      return events
        .filter((e: Event) => !skipFree || e.transparency !== "transparent")
        .map((e: Event) => {
          if (format) {
            return (format as string)
              .replace("/Summary", resolveSummary(e))
              .replace("/Link", e.htmlLink || "")
              .replace("/Hangout", e.hangoutLink || "")
              .replace("/Location", e.location || "")
              .replace("/Start Time", resolveDate(e.start))
              .replace("/End Time", resolveDate(e.end))
              .replace("{summary}", resolveSummary(e))
              .replace("{link}", e.htmlLink || "")
              .replace("{hangout}", e.hangoutLink || "")
              .replace("{location}", e.location || "")
              .replace(/{start:?(.*?)}/, (_, format) =>
                resolveDate({ ...e.start, format })
              )
              .replace(/{end:?(.*?)}/, (_, format) =>
                resolveDate({ ...e.end, format })
              );
          } else {
            const summaryText = resolveSummary(e);
            const summary =
              includeLink && e.htmlLink
                ? `[${summaryText}](${e.htmlLink})`
                : summaryText;
            const meetLink = e.hangoutLink ? ` - [Meet](${e.hangoutLink})` : "";
            const zoomLink =
              e.location && e.location.indexOf("zoom.us") > -1
                ? ` - [Zoom](${e.location})`
                : "";
            return `${summary} (${resolveDate(e.start)} - ${resolveDate(
              e.end
            )})${meetLink}${zoomLink}`;
          }
        });
    })
    .catch((e) =>
      e.message === "Request failed with status code 404"
        ? [
            `Error for calendar ${calendarId}: Could not find calendar or it's not public. For more information on how to make it public, [visit this page](https://roamjs.com/extensions/google-calendar)`,
          ]
        : genericError(e)
    );
};

const importGoogleCalendar = async (
  _?: {
    [key: string]: string;
  },
  blockUid?: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const bullets = await fetchGoogleCalendar();
  await pushBullets(bullets, blockUid, parentUid);
};

runExtension("google-calendar", () => {
  addButtonListener(GOOGLE_COMMAND, importGoogleCalendar);
});

createCustomSmartBlockCommand({
  command: "GOOGLECALENDAR",
  processor: async () =>
    fetchGoogleCalendar().then(async (bullets) => {
      if (bullets.length) {
        bullets
          .slice(1)
          .forEach((s) =>
            window.roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(s)
          );
        return bullets[0];
      } else {
        return EMPTY_MESSAGE;
      }
    }),
});
