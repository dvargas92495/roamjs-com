## UNDER DEVELOPMENT

## Oura Ring to Roam Integration

The Oura Ring to Roam Integration allows users to import their daily summaries on a given day into their daily notes page. The name of the script is `oura-ring`.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/oura-ring]]` page:

- `Token` - (Required) This is the personal access token associated with your Oura Ring account. The extension needs this in order to access your personal data. [Click here](https://cloud.ouraring.com/personal-access-tokens), to generate your own personal access token.

Create a button by typing `{{import oura ring}}` into a page. If the page is a Daily note page, it will query the day before the page title, since you usually want to track last night's sleep. Otherwise, it will query yesterday's data by default. It will output the following text:

```
Bedtime Start:: hh:mm:ss
Bedtime End:: hh:mm:ss
Sleep Duration:: hh:mm:ss
Total Sleep:: hh:mm:ss
Total Awake:: hh:mm:ss
Light Sleep:: hh:mm:ss
Rem Sleep:: hh:mm:ss
Deep Sleep:: hh:mm:ss
Day Start:: hh:mm:ss
Day End:: hh:mm:ss
Low Activity:: hh:mm:ss
Medium Activity:: hh:mm:ss
High Activity:: hh:mm:ss
Rest Activity:: hh:mm:ss
Readiness Score:: hh:mm:ss
```

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("oura-ring");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roamjs.com/oura-ring.js";
s.id = "oura-ring";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
