const importCalendarListener = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  console.log("entering...");
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText.toUpperCase() === "IMPORT GOOGLE CALENDAR"
  ) {
    const textBlock = document.getElementById(
      "block-input-gxCw10dD79O6yRGXFYiqBvd1doo1-body-outline-9QvQlzvmv-ysHo8-1-N"
    ).children[0] as HTMLElement;
    const apiKey = textBlock.innerText;
    if (!apiKey) {
      console.log("Could not find API KEY!");
      return;
    }

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
