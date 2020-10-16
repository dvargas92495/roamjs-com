## Pull References

The Pull References gives user the ability to pull references to the page. The name of the script is `pull-references`.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/pull-references]]` page:

- `Format` - (Optional) The format that each reference will use when added to the page. Use `${ref}` to specify where you want the text to be replaced by the block reference.
- `Remove Tags` - (Optional) Set to 'True' if you would like to remove the tags from the block references after pulling them to the page.

Create a button by typing `{{pull references}}` into a page. Clicking the button adds all the linked references as references on the current page.

### Installation

Insert this as a child of any `{{[[roam/js]]}}` block to install the extension.

```javascript
var old = document.getElementById("pull-references");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/pull-references.js";
s.id = "pull-references";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/pull-references.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
