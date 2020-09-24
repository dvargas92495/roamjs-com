## Query Tools

The Query Tools extension adds various tools on top of traditional Roam queries to make them more powerful

### Usage

The script is not configurable.

On expanded queries, there will be a sort icon that appears next to the results text.

```javascript
var old = document.getElementById("query-tools");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/query-tools.js";
s.id = "query-tools";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
