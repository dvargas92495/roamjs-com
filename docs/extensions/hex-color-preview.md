## UNDER DEVELOPMENT

## Hex Code Preview

The Hex Code Preview extension renders a preview square of the color next to valid tagged hex codes. 

### Usage

The script is not configurable.

### Installation

```javascript
var old = document.getElementById("hex-code-preview");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/hex-code-preview.js";
s.id = "hex-code-preview";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
