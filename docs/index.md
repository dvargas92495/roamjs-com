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

Each extension will support a `[[roam/js/[name]]]` configuration page in your Roam database. This is where you will be able to configure the extension with various options using attributes.
