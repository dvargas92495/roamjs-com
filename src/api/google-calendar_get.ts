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
    calendarId
      .split(",")
      .map((c) =>
        axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            c
          )}/events?${token}&timeMin=${encodeURIComponent(
            timeMin
          )}&timeMax=${encodeURIComponent(
            timeMax
          )}&orderBy=startTime&singleEvents=true`
        )
      )
  )
    .then((rs) => rs.flatMap((r) => r.data.items))
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
