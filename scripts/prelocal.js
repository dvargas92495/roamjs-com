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
const url =
  "https://news.naver.com/main/read.nhn?mode=LSD&mid=shm&sid1=105&oid=011&aid=0003838365";
const axios = require("axios");
const charset = require("charset");
const iconv = require("iconv-lite");

axios
  .get(url, {
    headers: { "Content-type": "text/html" },
    responseType: "document",
    responseEncoding: "base64"
  })
  .then((r) => {
    const enc = charset(r.headers) || "utf8";
    //const data = iconv.decode(r.data, enc);
    //const pre = data.substring(data.indexOf("media_end_summary") + 18);
    //const out = pre.substring(0, pre.indexOf("</strong>"));
    console.log(enc, r.data.substring(0, 1000));
  });
