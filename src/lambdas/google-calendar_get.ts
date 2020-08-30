import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";

const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const { calendarId, timeMin, timeMax } = event.queryStringParameters;
  axios
    .get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`
    )
    .then((r) => ({
      status: 200,
      body: JSON.stringify(r.data.items),
      headers,
    }))
    .catch((e) => ({
      status: 500,
      body: e.message,
      headers,
    }));
};
