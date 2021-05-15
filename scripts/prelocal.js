console.log(`
Running a local http-server...

To access an extension that you're developing locally in 
your Roam database, create a {{[[roam/js]]}} block and add
the following code snippet as a child:

var s = document.createElement('script')
s.type = "text/javascript"
s.src = \`http://127.0.0.1:8080/build/\$\{name\}.js\`
s.async = true
document.getElementsByTagName('head')[0].appendChild(s)

Then refresh Roam and start testing!
`);
