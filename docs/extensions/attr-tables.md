# UNDER DEVELOPMENT

## Attr Tables

The Attr Tables extensions adds various features to attribute tables.

### Usage

This script is not configurable.

Whenever you create an Attribute Table, there will be a new sort icon next to each of the column headers. Clicking the sort icon will toggle between three states: Neutral, Ascending, and Descending.

### Installation

```javascript
var old = document.getElementById("attr-table");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/attr-table.js";
s.id = "attr-table";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
