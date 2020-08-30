## Google Calendar to Roam Integration

The Google Calendar to Roam Integration allows users to import the list of events on a given day into their daily notes page. The name of the script is `google-calendar`.

### Usage

The script supports the following configuration attributes:

- `Google Calendar` - (Required) This is the calendar ID that the extension will use to query for events. It's usually your gmail address, such as `dvargas92495@gmail.com`.

In any page, type `/Import Google Calendar` then hit Enter. The extension will clear the slash command and fill the page in with the events you have scheduled for that day in the following format:

> [Summary] @ [Start Time (hh:mm am)] - [End Time (hh:mm pm)]

It will be displayed in the timezone of your browser.

### Code Block

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
