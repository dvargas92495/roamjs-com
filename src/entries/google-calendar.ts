const { google } = require("googleapis");

const importCalendarListener = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText === "Import Google Calendar"
  ) {
    const apiKey = document.getElementById("google-calendar-api-key").nodeValue;

    const calendar = google.calendar({
      version: "v3",
      auth: apiKey,
    });
    console.log("trigger import events");
    calendar.list().then((cals: any) => console.log(cals));
  }
};
