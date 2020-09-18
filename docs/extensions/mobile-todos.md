## Mobile TODOs

The Mobile TODO extension provides user with the `[[TODO]]`/`[[DONE]]` shortcut previously only accessible to keyboard shortcuts.

### Usage

The script is not configurable.

On a mobile device, focus on a block. Once the keyboard and mobile bar comes up from the bottom, hit the menu icon on the bottom right. This will toggle a new set of buttons, the first of which is a shortcut for TODOs on mobile!

```javascript
var old = document.getElementById("mobile-todos");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/mobile-todos.js";
s.id = "mobile-todos";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
