import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { wrapAxios, userError, serverError } from "../lambda-helpers";

const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { calendarId, timeMin, timeMax } = event.queryStringParameters;
  if (!calendarId) {
    return userError("calendarId is required");
  }
  if (!apiKey) {
    return serverError("No API key stored");
  }
  return wrapAxios(
    axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?key=${apiKey}&timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(
        timeMax
      )}&orderBy=startTime&singleEvents=true`
    )
  );
};
