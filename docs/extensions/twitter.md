## Twitter to Roam Integration

The Twitter integration allows users to import all their tweets pertaining to a particular page. So, if you've tweeted about `books` a lot on twitter, you can head over to the `books` page on roam, and then pull all your tweets about `books`!
One caveat is that this can only pull tweets made in the last 7 days.

The name of the script is `twitter`

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/twitter]]` page:

- `Username` - (Required) This is your twitter handle.

Here's an example configuration page:

![](../images/twitter-config.png)

In any page, create a `Twitter References` button by typing in `{{twitter references}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the button and fill the page in with the tweets where you've mentioned that page title

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("twitter");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/twitter.js";
s.id = "twitter";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
