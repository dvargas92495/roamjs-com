## UNDER DEVELOPMENT

## Oura Ring to Roam Integration

The Oura Ring to Roam Integration allows users to import their daily summaries on a given day into their daily notes page. The name of the script is `oura-ring`.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/oura-ring]]` page:

- `Token` - (Required) This is the personal access token associated with your Oura Ring account. The extension needs this in order to access your personal data. To generate your own personal access token, visit https://t.co/O1oEzNHKva?amp=1.

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("oura-ring");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/oura-ring.js";
s.id = "oura-ring";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
