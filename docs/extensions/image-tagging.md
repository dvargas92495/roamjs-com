## Image Tagging

The Image Tagging extension extracts the text from an image and outputs it into Roam!

## Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/image-tagging]]` page:

- `Trigger` - (Optional) The action to do on an image to extract a text. Valid values include `DOUBLE CLICK`, `SHIFT CLICK`, and `ICON CLICK`. By default, it uses `DOUBLE CLICK`.

Double click on an image in your database. The extension will use an OCR library to extract all the text found in an image. In the meantime, it will insert a "Loading..." text as a child block. Once the extension finishes, it will replace the Loading text with all the new text it parsed from the image.

If the text begins with a bullet or dash on a line, the bullet will be stripped, leaving the rest of the text content.

## Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("image-tagging");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/image-tagging.js";
s.id = "image-tagging";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

## Demo

<video width="320" height="240" controls>
  <source src="../../videos/image-tagging.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
