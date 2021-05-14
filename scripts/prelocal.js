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

const REGEX = /<div class="problem_content" role="problem">(.*?)<\/div>/s;
require('axios')
    .get(`https://projecteuler.net/problem=1`, {
      headers: {
        "Content-type": "text/html",
      },
      responseType: "document",
    })
    .then((r) => {
        console.log(r.data);
        console.log(REGEX.exec(r.data)[1].replace(/<(\/)?p>/g, ''))
    })