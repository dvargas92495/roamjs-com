const importCalendarListener = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText === "Import Google Calendar"
  ) {
    const apiKey = document.getElementById("google-calendar-api-key").nodeValue;

    fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${apiKey}`)
      .then(r => r.json())
      .then(cs => console.log(cs));
    console.log("trigger import events");
  }
};

document.addEventListener('click', importCalendarListener);
