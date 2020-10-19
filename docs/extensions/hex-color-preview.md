## UNDER DEVELOPMENT

## Hex Color Preview

The Hex Color Preview extension renders a preview square of the color next to valid tagged hex codes. 

### Usage

The script is not configurable.

All you have to do is have the extension installed. Anytime you create a valid hex color tag, it will render a colored preview next to the tag.

To change the CSS styling of the preview, you'll want to change the CSS associated with the `roamjs-hex-color-preview` class.

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
