![](./images/logo.png)

## Extensions

These docs explain all of the available extensions, as well as how to set up and use each one. Each extension gets bundled into its own script file, with the entrypoints stored [here](https://github.com/dvargas92495/roam-js-extensions/tree/master/src/entries).

## Usage

Each tool is hosted at `https://roam.davidvargas.me/master/[name].js`. To use any given tool, add the following code block under a `{{[[roam/js]]}}` block in your Roam database, replacing `[name]` with the actual name of the script:

```javascript
var old = document.getElementById("[name]");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/[name].js";
s.id = "[name]";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

The code block runs on initial load of your roam database. It adds a script tag to the head of your browser, which loads then runs the tool, providing you with the added functionality.

To install multiple scripts in a single code block, add the following code block instead:

```javascript
const addScript = (name) => {
  var old = document.getElementById(name);
  if (old) {
    old.remove();
  }

  var s = document.createElement("script");
  s.src = `https://roam.davidvargas.me/master/${name}.js`;
  s.id = name;
  s.async = false;
  s.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(s);
};

addScript("[name1]"); // replace with name of extension
addScript("[name2]"); // replace with name of extension
// ...
```

To install __all__ the supported extensions, click the button below and paste the output anywhere in your Roam DB!

<form action="javascript:%3B(()%3D%3E%7Blet%20l%20%3D%20function(e)%20%7B%0Ae.clipboardData.setData(%22text%2Fplain%22%2C%20%22-%20%7B%7B%5B%5Broam%2Fjs%5D%5D%7D%7D%5Cn%20%20%20%20-%20%60%60%60javascript%5Cnconst%20addScript%20%3D%20name%20%3D%3E%20%7B%5Cn%20%20var%20s%20%3D%20document.createElement('script')%5Cn%20%20%20%20%20%20s.type%20%3D%20%5C%22text%2Fjavascript%5C%22%5Cn%20%20%20%20%20%20s.src%20%3D%20%60https%3A%2F%2Froam.davidvargas.me%2Fmaster%2F%24%7Bname%7D.js%60%5Cn%20%20%20%20%20%20s.async%20%3D%20true%5Cn%20%20document.getElementsByTagName('head')%5B0%5D.appendChild(s)%5Cn%7D%5Cn%5CnaddScript('google-calendar')%3B%5CnaddScript('emojis')%3B%5CnaddScript('github')%3B%5CnaddScript('todont')%3B%5CnaddScript('sort-references')%3B%5CnaddScript('mobile-todos')%3B%5CnaddScript('query-tools')%3B%5CnaddScript('twitter')%3B%60%60%60%5Cn%22)%0Ae.clipboardData.setData(%22text%2Fhtml%22%2C%20%22%3Chtml%3E%5Cr%5Cn%3Cbody%3E%5Cr%5Cn%3C!--StartFragment--%3E%3Cul%3E%3Cli%20style%3D%5C%22text-align%3Ainherit%3B%5C%22%3E%3Cspan%20style%3D%5C%22text-align%3Ainherit%3B%5C%22%3E%3Cspan%3E%7B%7B%5B%5Broam%2Fjs%5D%5D%7D%7D%3C%2Fspan%3E%3C%2Fspan%3E%3Cul%3E%3Cli%20style%3D%5C%22text-align%3Ainherit%3B%5C%22%3E%3Cspan%20style%3D%5C%22text-align%3Ainherit%3B%5C%22%3E%3Cspan%3E%3Cpre%3E%3Ccode%3Ejavascript%5Cnconst%20addScript%20%3D%20name%20%3D%3E%20%7B%5Cn%20%20var%20s%20%3D%20document.createElement('script')%5Cn%20%20%20%20%20%20s.type%20%3D%20%5C%22text%2Fjavascript%5C%22%5Cn%20%20%20%20%20%20s.src%20%3D%20%60https%3A%2F%2Froam.davidvargas.me%2Fmaster%2F%24%7Bname%7D.js%60%5Cn%20%20%20%20%20%20s.async%20%3D%20true%5Cn%20%20document.getElementsByTagName('head')%5B0%5D.appendChild(s)%5Cn%7D%5Cn%5CnaddScript('google-calendar')%3B%5CnaddScript('emojis')%3B%5CnaddScript('github')%3B%5CnaddScript('todont')%3B%5CnaddScript('sort-references')%3B%5CnaddScript('mobile-todos')%3B%5CnaddScript('query-tools')%3B%5CnaddScript('twitter')%3B%3C%2Fcode%3E%3C%2Fpre%3E%3C%2Fspan%3E%3C%2Fspan%3E%3C%2Fli%3E%3C%2Ful%3E%3C%2Fli%3E%3C%2Ful%3E%3C!--EndFragment--%3E%5Cr%5Cn%3C%2Fbody%3E%5Cr%5Cn%3C%2Fhtml%3E%22)%0Ae.clipboardData.setData(%22roam%2Fdata%22%2C%20%22%5B%5C%22%5E%20%5C%22%2C%5C%22~%3Adb-id%5C%22%2C%5C%22dvargas92495%5C%22%2C%5C%22~%3Atype%5C%22%2C%5C%22~%3Acopy%5C%22%2C%5C%22~%3Acopied-data%5C%22%2C%5B%5B%5C%22%5E%20%5C%22%2C%5C%22~%3Ablock%2Fstring%5C%22%2C%5C%22%7B%7B%5B%5Broam%2Fjs%5D%5D%7D%7D%5C%22%2C%5C%22~%3Acreate%2Femail%5C%22%2C%5C%22dvargas92495%40gmail.com%5C%22%2C%5C%22~%3Acreate%2Ftime%5C%22%2C1598281876034%2C%5C%22~%3Ablock%2Fchildren%5C%22%2C%5B%5B%5C%22%5E%20%5C%22%2C%5C%22%5E4%5C%22%2C%5C%22~%60%60%60javascript%5C%5Cnconst%20addScript%20%3D%20name%20%3D%3E%20%7B%5C%5Cn%20%20var%20s%20%3D%20document.createElement('script')%5C%5Cn%20%20%20%20%20%20s.type%20%3D%20%5C%5C%5C%22text%2Fjavascript%5C%5C%5C%22%5C%5Cn%20%20%20%20%20%20s.src%20%3D%20%60https%3A%2F%2Froam.davidvargas.me%2Fmaster%2F%24%7Bname%7D.js%60%5C%5Cn%20%20%20%20%20%20s.async%20%3D%20true%5C%5Cn%20%20document.getElementsByTagName('head')%5B0%5D.appendChild(s)%5C%5Cn%7D%5C%5Cn%5C%5CnaddScript('google-calendar')%3B%5C%5CnaddScript('emojis')%3B%5C%5CnaddScript('github')%3B%5C%5CnaddScript('todont')%3B%5C%5CnaddScript('sort-references')%3B%5C%5CnaddScript('mobile-todos')%3B%5C%5CnaddScript('query-tools')%3B%5C%5CnaddScript('twitter')%3B%60%60%60%5C%22%2C%5C%22%5E5%5C%22%2C%5C%22dvargas92495%40gmail.com%5C%22%2C%5C%22%5E6%5C%22%2C1599845979418%2C%5C%22~%3Ablock%2Fuid%5C%22%2C%5C%22CIjwrDAAW%5C%22%2C%5C%22~%3Ablock%2Fopen%5C%22%2Ctrue%2C%5C%22~%3Aedit%2Ftime%5C%22%2C1601331252805%2C%5C%22~%3Aedit%2Femail%5C%22%2C%5C%22dvargas92495%40gmail.com%5C%22%2C%5C%22~%3Ablock%2Forder%5C%22%2C0%5D%5D%2C%5C%22%5E8%5C%22%2C%5C%22uDNLw5PDg%5C%22%2C%5C%22%5E9%5C%22%2Ctrue%2C%5C%22%5E%3A%5C%22%2C1599671559021%2C%5C%22%5E%3B%5C%22%2C%5C%22dvargas92495%40gmail.com%5C%22%2C%5C%22%5E%3C%5C%22%2C4%5D%5D%5D%22)%0Ae.preventDefault()%0A%7D%0Adocument.addEventListener(%22copy%22%2C%20l)%0Adocument.execCommand(%22copy%22)%0Adocument.removeEventListener(%22copy%22%2C%20l)%7D)()%3B">
    <button title="All Extensions" style="background-color: #fafbfc; border: 1px solid #1b1f2326; color: #24292e; padding: 5px 16px; font-size: 14px; font-weight: 500; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji; border-radius: 6px; margin-bottom: 24px;">Copy Code</button>
</form>

Each extension will support a `[[roam/js/[name]]]` configuration page in your Roam database. This is where you will be able to configure the extension with various options using attributes.

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
