const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const cloudfront = new AWS.CloudFront({ apiVersion: "2020-05-31" });

const extension = process.argv[2];

const content = fs.readFileSync(`out/extensions/${extension}.html`).toString();
const linkRegex = /<(?:link|script) (?:.*?)(?:href|src)="(.*?)"(?:.*?)\/>/;
const uploads = Array.from(
  new Set(
    content
      .match(new RegExp(linkRegex, "g"))
      .map((m) => m.match(linkRegex)[1])
      .map(decodeURIComponent)
  )
)
  .map((m) => ({
    name: m,
    Body: fs.readFileSync(path.join(__dirname, "..", "out", m)).toString(),
  }))
  .map(({ name, Body }) =>
    s3.upload({ Bucket: "roamjs.com", Body, Key: name.slice(1) }).promise()
  );

Promise.all([
  s3
    .upload({
      Bucket: "roamjs.com",
      Body: content,
      Key: `extensions/${extension}`,
      ContentType: "text/html",
    })
    .promise(),
  ...uploads,
]).then(() => {
  console.log("Successfully uploaded files");
  return cloudfront
    .createInvalidation({
      DistributionId: process.env.CLOUDFRONT_ARN.match(
        /:distribution\/(.*)$/
      )[1],
      InvalidationBatch: {
        CallerReference: new Date().toJSON(),
        Paths: {
          Quantity: 1,
          Items: [`/extensions/${extension}`],
        },
      },
    })
    .promise();
}).then(() => {
    console.log('Done! Maybe we should wait for invalidation to finish here...');
});
