## UNDER DEVELOPMENT

## TODO Triggers

The TODO Trigger extension allows the user to tie an action upon converting a TODO to DONE.

### Usage

The script is not configurable.

Anytime a user clicks a TODO checkbox to become DONE, an action fires.

```javascript
var old = document.getElementById("todo-trigger");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/todo-trigger.js";
s.id = "todo-trigger";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
