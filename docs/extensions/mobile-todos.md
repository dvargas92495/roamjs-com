## Mobile TODOs

The Mobile TODO extension provides user with the `[[TODO]]`/`[[DONE]]` shortcut previously only accessible to keyboard shortcuts.

### Usage

The script is not configurable.

On a mobile device, focus on a block. Once the keyboard and mobile bar comes up from the bottom, hit the menu icon on the bottom right. This will toggle a new set of buttons, the first of which is a shortcut for TODOs on mobile! Click the icon to toggle between TODO/DONE states!

```javascript
var old = document.getElementById("mobile-todos");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/mobile-todos.js";
s.id = "mobile-todos";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/mobile-todos.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
