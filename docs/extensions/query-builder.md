## UNDER DEVELOPMENT

## Query Builder

The Query Builder extension introduces a new user interface for building queries and outputting the query syntax into the block.

### Usage

The script is not configurable.

In a block, type `{{query builder}}`. Similar to date picker, there will be an overlay that appears next to the query builder button. 

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

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
