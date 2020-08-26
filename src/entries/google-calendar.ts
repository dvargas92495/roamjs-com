const importCalendarListener = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  console.log("target: ");
  console.log(target);
  console.log(target.tagName);
  console.log(target.innerText);
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText === "Import Google Calendar"
  ) {
    const apiKey = document.getElementById(
      "block-input-gxCw10dD79O6yRGXFYiqBvd1doo1-body-outline-9QvQlzvmv-ysHo8-1-N"
    ).nodeValue;

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
      .then((es) => {
        console.log(es);
        return 0;
      });
  }
};

document.addEventListener("click", importCalendarListener);
