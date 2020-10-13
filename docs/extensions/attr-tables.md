## Attr Tables

The Attr Tables extensions adds various features to attribute tables.

### Usage

This script is not configurable.

Whenever you create an Attribute Table, there will be a new sort icon next to each of the column headers. Clicking the sort icon will toggle between three states: Neutral, Ascending, and Descending.

The table will then be sorted based on the columns you clicked on. A marker next to each column will appear to show the sort priority.

Because attribute tables are view only, navigating away from the page will wipe out any previous sort you had applied. To solve this, you could add a `Default Sort` attribute as a child. The value should be a comma delimited list of each column with the type of sort you want sorted. For example, if I wanted a table sorted first by "foo" column ascending, followed by "bar" column descending, I would use the following default sort value:

```
Default Sort:: foo=Asc, bar=Des
```

### Installation

```javascript
var old = document.getElementById("attr-tables");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/attr-tables.js";
s.id = "attr-tables";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/attr-tables.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
