## Google Calendar to Roam Integration

The Google Calendar to Roam Integration allows users to import the list of events on a given day into their daily notes page. The name of the script is `google-calendar`.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/google-calendar]]` page:

- `Google Calendar` - (Required) This is the calendar ID that the extension will use to query for events. It's usually your gmail address, such as `dvargas92495@gmail.com`.
- `Include Event Link` - (Optional) Set to `true` if you would like to hyperlink the event summary with a link to the google calendar event. Note, because there are more characters to be typed it's a slower operation.

In any page, create a `Import Google Calendar` button by typing in `{{import google calendar}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the slash command and fill the page in with the events you have scheduled for that day in the following format:

> [Summary] ([Start Time (hh:mm am)] - [End Time (hh:mm pm)]) [ - link to Zoom/Meet]

It will be displayed in the timezone of your browser.

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("google-calendar");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/google-calendar.js";
s.id = "google-calendar";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../videos/google-calendar.mp4" type="video/mp4">
</video>
