const importCalendarListener = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText === "Import Google Calendar"
  ) {
    const apiKey = document.getElementById("google-calendar-api-key").nodeValue;

    console.log("trigger import events");
    fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${apiKey}`
    )
      .then((r) => r.json())
      .then((cs) => {
        console.log(cs);
        const calendarId = cs[0].id;
        return fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`
        );
      })
      .then((r) => r.json())
      .then((es) => console.log(es));
  }
};

document.addEventListener("click", importCalendarListener);
