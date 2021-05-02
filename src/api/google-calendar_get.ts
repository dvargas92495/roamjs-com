import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { userError, headers } from "../lambda-helpers";

const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { calendarId, timeMin, timeMax } = event.queryStringParameters;
  if (!calendarId) {
    return userError("calendarId is required", event);
  }
  const token = event.headers.Authorization
    ? `access_token=${event.headers.Authorization}`
    : `key=${apiKey}`;
  return Promise.all(
    calendarId.split(",").map((c) =>
      axios
        .get<{
          items: { start?: { dateTime: string }; summary?: string }[];
        }>(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            c
          )}/events?${token}&timeMin=${encodeURIComponent(
            timeMin
          )}&timeMax=${encodeURIComponent(
            timeMax
          )}&orderBy=startTime&singleEvents=true`
        )
        .then((r) => ({ items: r.data.items, calendar: c }))
    )
  )
    .then((rs) =>
      rs
        .flatMap((r) => r.items.map((i) => ({ ...i, calendar: r.calendar })))
        .sort((a, b) => {
          if (a.start?.dateTime === b.start?.dateTime) {
            return (a.summary || "").localeCompare(b.summary || "");
          } else if (!a.start?.dateTime) {
            return -1;
          } else if (!b.start?.dateTime) {
            return 1;
          } else {
            return new Date(a.start.dateTime).valueOf() - new Date(b.start.dateTime).valueOf();
          }
        })
    )
    .then((items) => ({
      statusCode: 200,
      body: JSON.stringify({ items }),
      headers: headers(event),
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers: headers(event),
    }));
};
