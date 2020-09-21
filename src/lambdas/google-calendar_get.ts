import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";
import { wrapAxios, userError, serverError } from "../lambda-helpers";

const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

export const handler = async (event: APIGatewayProxyEvent) => {
  const { calendarId, timeMin, timeMax } = event.queryStringParameters;
  if (!calendarId) {
    return userError("calendarId is required");
  }
  if (!apiKey) {
    return serverError("No API key stored");
  }
  console.log("calendarId", calendarId);
  console.log("timeMin", timeMin);
  console.log("timeMax", timeMax);
  return wrapAxios(
    axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`
    )
  );
};
