import {
  createCustomSmartBlockCommand,
  getCurrentPageUid,
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
  getTreeByPageName,
  createBlock,
} from "roam-client";
import axios from "axios";
import formatRFC3339 from "date-fns/formatRFC3339";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import format from "date-fns/format";
import { createConfigObserver } from "../components/ConfigPage";
import GoogleLogo from "../assets/Google.svg";
import differenceInSeconds from "date-fns/differenceInSeconds";

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
const CONFIG = "roam/js/google-calendar";
const resolveDate = (d: { dateTime?: string; format?: string }) => {
  if (!d?.dateTime) {
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
  const pageTitle = getPageTitle(document.activeElement);
  const dateFromPage = parseRoamDate(pageTitle.textContent);

  const legacyConfig = getConfigFromPage(CONFIG);
  const configTree = getTreeByPageName(CONFIG);
  const oauthNode = configTree.find((t) => /oauth/i.test(t.text))
    ?.children?.[0];
  const { access_token, expires_in, refresh_token } = JSON.parse(
    oauthNode?.text || "{}"
  );
  const tokenAge = differenceInSeconds(
    new Date(),
    oauthNode?.editTime || new Date()
  );
  const Authorization =
    tokenAge > expires_in
      ? await axios
          .post(`${process.env.REST_API_URL}/google-auth`, {
            refresh_token,
            grant_type: "refresh_token",
          })
          .then((r) => {
            window.roamAlphaAPI.updateBlock({
              block: {
                uid: oauthNode.uid,
                string: JSON.stringify({ refresh_token, ...r.data }),
              },
            });
            return r.data.access_token;
          })
      : access_token;
  const importTree = configTree.find((t) => /import/i.test(t.text));

  const calendarId =
    importTree?.children
      ?.find?.((t) => /calendars/i.test(t.text))
      ?.children?.map((c) => c.text)
      ?.join?.(",") || legacyConfig["Google Calendar"]?.trim();
  if (!calendarId) {
    return [
      `Error: Could not find a calendar to import on the [[${CONFIG}]] page.`,
    ];
  }
  const includeLink =
    importTree?.children?.some?.((t) => /include event link/i.test(t.text)) ||
    legacyConfig["Include Event Link"]?.trim() === "true";
  const skipFree =
    importTree?.children?.some?.((t) => /skip free/i.test(t.text)) ||
    legacyConfig["Skip Free"]?.trim() === "true";
  const format =
    importTree?.children
      ?.find?.((t) => /format/i.test(t.text))
      ?.children?.[0]?.text?.trim?.() || legacyConfig["Format"]?.trim?.();
  const dateToUse = isNaN(dateFromPage.valueOf()) ? new Date() : dateFromPage;
  const timeMin = startOfDay(dateToUse);
  const timeMax = endOfDay(timeMin);
  const timeMinParam = encodeURIComponent(formatRFC3339(timeMin));
  const timeMaxParam = encodeURIComponent(formatRFC3339(timeMax));

  return axios
    .get(
      `${
        process.env.REST_API_URL
      }/google-calendar?calendarId=${encodeURIComponent(
        calendarId
      )}&timeMin=${timeMinParam}&timeMax=${timeMaxParam}`,
      Authorization
        ? {
            headers: {
              Authorization,
            },
          }
        : {}
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
        : [genericError(e)]
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

const importGoogleCalendarCommand = () => {
  const parentUid = getCurrentPageUid();
  const blockUid = createBlock({ node: { text: "Loading" }, parentUid });
  return fetchGoogleCalendar().then((bullets) => {
    pushBullets(bullets, blockUid, parentUid);
  });
};

runExtension("google-calendar", () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              type: "oauth",
              title: "oauth",
              description: "Click the button below to login with Google",
              options: {
                service: "google",
                getPopoutUrl: () =>
                  Promise.resolve(
                    `https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=https://roamjs.com/oauth?auth=true&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/calendar.events.readonly&include_granted_scopes=true`
                  ),
                getAuthData: (data) =>
                  axios
                    .post(`${process.env.REST_API_URL}/google-auth`, {
                      ...JSON.parse(data),
                      grant_type: "authorization_code",
                    })
                    .then((r) => r.data),
                ServiceIcon: GoogleLogo,
              },
            },
          ],
        },
        {
          id: "import",
          fields: [
            {
              type: "pages",
              title: "calendars",
              description: "The calendar ids to import events from.",
              defaultValue: ["dvargas92495@gmail.com"],
            },
            {
              type: "flag",
              title: "include event link",
              description:
                "Whether or not to hyperlink the summary with the event link. Ignored if 'format' is specified.",
            },
            {
              type: "flag",
              title: "skip free",
              description:
                "Whether or not to filter out events marked as 'free'",
            },
            {
              type: "text",
              title: "format",
              description:
                "The format events should output in when imported into Roam",
            },
          ],
        },
      ],
    },
  });

  addButtonListener(GOOGLE_COMMAND, importGoogleCalendar);
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Import Google Calendar",
    callback: importGoogleCalendarCommand,
  });
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
