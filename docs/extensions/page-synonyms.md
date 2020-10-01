## Page Synonyms

The Page Synonyms extension allows you to define synonyms for pages to allow for easier referencing between common terms.

### Usage

The script is not configurable.

This extension adds a new option to block context menus that says "Alias Page Synonyms". Right click a block and click on the option to replace all text in the block with a reference to its defined alias. To define aliases, go to the page and add an `Aliases` attribute. All values should be comma delimited.

For example, to have `Tasks` and `task` alias back to `Task`, create an `Aliases` attribute on the `Task` page. The page should have a block that displays `Aliases:: Tasks, task`.

The extension also works for selecting multiple blocks. When you highlight and right click multiple selected blocks, the "Alias Page Synonyms" will appear and perform the same operation as described above.

Note that the extension does a simple search and replace. That means if aliases are nested in other words or already have links, it will still replace the instance with a new link.

There's currently a known, yet non-deterministic bug related to periods being replaced when clicking the option. It's being investigated [here](https://github.com/dvargas92495/roam-js-extensions/issues/139). The issue will also be solved when the new Roam API is ready.

## Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("page-synonyms");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/page-synonyms.js";
s.id = "page-synonyms";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

## Demo

<video width="320" height="240" controls>
  <source src="../../videos/page-synonyms.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
