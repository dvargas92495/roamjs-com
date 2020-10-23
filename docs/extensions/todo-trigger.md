## TODO Triggers

The TODO Trigger extension allows the user to tie an action upon converting a TODO to DONE.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/todo-trigger]]` page:

- `Append Text` - (Optional) The text to add to the end of a block, when an item flips from TODO to DONE. Could use "/Current Time" to always put the current time and "/Today" to always put the current day. All other text is static.
- `Replace Tags` - (Optional) The set of pairs that you would want to be replaced upon switching between todo and done. Multiple pairs are deliminited by `|` and each pair is delimited by `,`. For example, `Replace Tags:: #toRead, #Read | #toWrite, #Written`
- `Strikethrough` - (Optional) Set to `True` to strikethrough blocks with `{{[[DONE]]}}`.

Anytime a TODO checkbox becomes DONE, either by user click or keyboard shortbut, the "Done" action fires. Similarly, when a DONE checkbox becomes TODO, the "Todo" action fires. 

When "Append Text" is configured, the "Done" action appends the configured text to the end of the block. The "Todo" action removes the configured text from the end of the block.

When "Replace Tags" is configured, the "Done" action replaces each pair's first tag with the second tag. The "Todo" action does the same replacement in reverse.

When "Strikethrough" is configured the "Done" action adds a strikethrough to the block. The "Todo" action removes it.

When None are configured, nothing happens.

### Installation

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

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/todo-trigger.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
