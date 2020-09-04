## Roam Emojis

The Roam Emoji extension allows users to use familiar colon syntax to insert emojis into the text block. The name of the script is `emojis`.

### Usage

The script is not configurable.

In a block, start typing with a colon, the name of the emoji, followed by an ending colon. The script will replace the colon'ed phrase with the supported emoji.

```javascript
var old = document.getElementById("emojis");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/emojis.js";
s.id = "emojis";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

To view all available emojis, they could be found in the following [JSON file](https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json).

<video width="320" height="240" controls>
  <source src="videos/emojis.mp4" type="video/mp4">
</video>
