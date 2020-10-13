## Archiving TODOs

The Archiving TODOs extension allows users to use the CTRL+SHIFT+ENTER keyboard shortcut to archive a TODO. In the text area it inserts `{{[[ARCHIVED]]}}` at the beginning of the block.

### Usage

The script is not configurable.

In a block, just hit CTRL+SHIFT+ENTER. Any TODOs or DONEs will be replaced with an ARCHIVED. If an ARCHIVED exists, it will be cleared. If none of the above exists, an ARCHIVED is inserted in the block.

```javascript
var old = document.getElementById("todont");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/todont.js";
s.id = "todont";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/todont.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
