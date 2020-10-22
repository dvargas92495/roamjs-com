## UNDER DEVELOPMENT

## TODO Triggers

The TODO Trigger extension allows the user to tie an action upon converting a TODO to DONE.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/todo-trigger]]` page:

- `Append Text` - (Optional) The text to add to the end of a block, when an item flips from TODO to DONE. Could use "/Current Time" to always put the current time and "/Today" to always put the current day. All other text is static.

Anytime a user clicks a TODO checkbox to become DONE, the "Done" action fires. If the user clicks a DONE checkbox to become TODO, the "Todo" action fires. 

When "Append Text" is configured, the "Done" action appends the configured text to the end of the block. The "Todo" action removes the configured text from the end of the string.

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
