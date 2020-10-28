## Query Builder

The Query Builder extension introduces a new user interface for building queries and outputting the query syntax into the block.

### Usage

The script is not configurable.

In a block, type `{{query builder}}`. Similar to date picker, there will be an overlay that appears next to the query builder button. After specifying different query components that you're interested in searching, hit save to insert the query syntax into the block.

The Overlay is fully keyboard accessible. Each input is focusable and you can `tab` and `shift+tab` through them. For the query component dropdown, you could use the following key strokes to navigate:
- Arrow Up/Arrow Down - Navigate Options
- Enter - Open Dropdown
- a - Select 'AND'
- o - Select 'OR'
- b - Select 'BETWEEN'
- t - Select 'TAG'
- n - Select 'NOT'

On any deletable component, you could hit `ctrl+Backspace` or `cmd+Backspace` to delete the icon. Hitting `enter` on the save button will output the query into the block.

### Installation

```javascript
var old = document.getElementById("query-builder");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/query-builder.js";
s.id = "query-builder";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
### Demo

<video width="320" height="240" controls>
  <source src="../../videos/query-builder.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
