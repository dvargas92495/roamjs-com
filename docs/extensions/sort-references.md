## Sort Linked References

The Sort Linked References extension adds an icon button to the user's page that could be used to sort linked references.

### Usage

The script is not configurable.

Near the linked references, there will appear a sort icon next to the filter icon. Clicking on the sort icon will make a sort menu visible to the user with the following options:

- Sort By Page Title - This will sort all the linked references in ascending alphabetical order of the page title.
- Sort By Created Date - This will sort all the linked references in ascending order that the page was created.

```javascript
var old = document.getElementById("sort-references");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/sort-references.js";
s.id = "sort-references";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
