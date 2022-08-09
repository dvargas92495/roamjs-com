const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const extension = process.argv[2];

const catalog = {
  Key: "extensions",
  Body: fs.readFileSync(`out/extensions.html`).toString(),
};
const content = fs.readFileSync(`out/extensions/${extension}.html`).toString();
const linkRegex = /<(?:link|script) (?:.*?)(?:href|src)="(.*?)"(?:.*?)(?:\/)?>/;
const readDir = (s) =>
  fs.existsSync(s)
    ? fs
        .readdirSync(s, { withFileTypes: true })
        .flatMap((f) =>
          f.isDirectory() ? readDir(`${s}/${f.name}`) : [`${s}/${f.name}`]
        )
    : [];
const allContent = fs.existsSync(`out/extensions/${extension}`)
  ? [
      catalog,
      { Key: `extensions/${extension}`, Body: content },
      ...readDir(`out/extensions/${extension}`).map((f) => ({
        Key: f.replace(/^out\//, ""),
        Body: fs.readFileSync(f).toString(),
      })),
    ]
  : [catalog, { Key: `extensions/${extension}`, Body: content }];
const fileNames = Array.from(
  new Set(
    allContent.flatMap((c) =>
      (c.Body.match(new RegExp(linkRegex, "g")) || [])
        .map((m) => m.match(linkRegex)[1])
        .map(decodeURIComponent)
    )
  )
);
console.log(
  "filenames to upload with",
  allContent.map(({ Key }) => Key.replace(/^extension\//, "")),
  "\n",
  fileNames
);
const uploads = fileNames
  .map((m) => ({
    name: m,
    Body: fs.readFileSync(path.join(__dirname, "..", "out", m)).toString(),
  }))
  .map(({ name, Body }) =>
    s3
      .upload({
        Bucket: "roamjs.com",
        Body,
        Key: name.slice(1),
        ContentType: name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
          ? "text/css"
          : "text/plain",
      })
      .promise()
  );

Promise.all([
  ...allContent.map(({ Key, Body }) =>
    s3
      .upload({
        Bucket: "roamjs.com",
        Body,
        Key: Key.replace(/\.html$/, ""),
        ContentType: "text/html",
      })
      .promise()
  ),
  ...uploads,
])
  .then(console.log);
