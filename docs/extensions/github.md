## Github to Roam Integration

The Github to Roam Integration allows users to import various types of data from Github and bring into their Roam Database. The name of the script is `github`.

### Usage

The script is not configurable.

In any page, create a `Import Github Issues` button by typing in `{{import github issues}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the slash command and fill the page in with the issues you have assigned to you in the following gormat:

> [title](html link)

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("github");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/github.js";
s.id = "github";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
