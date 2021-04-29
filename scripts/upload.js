const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const cloudfront = new AWS.CloudFront({ apiVersion: "2020-05-31" });
const waitForCloudfront = (props) => new Promise((resolve) => {
  const { trial = 0, ...args } = props;
  const status = await cloudfront
    .getInvalidation(args)
    .promise()
    .then((r) => r.Invalidation.Status);
  if (status === "Completed") {
    resolve("Done!");
  } else if (trial === 60) {
    resolve("Ran out of time waiting for cloudfront...");
  } else {
    console.log(
      "Still waiting for invalidation. Found",
      status,
      "on trial",
      trial
    );
    setTimeout(() => waitForCloudfront({ ...args, trial: trial + 1 }), 1000);
  }
});

const extension = process.argv[2];
const DistributionId = process.env.CLOUDFRONT_ARN.match(
  /:distribution\/(.*)$/
)[1];

const content = fs.readFileSync(`out/extensions/${extension}.html`).toString();
const linkRegex = /<(?:link|script) (?:.*?)(?:href|src)="(.*?)"(?:.*?)(?:\/)?>/;
const fileNames = Array.from(
  new Set(
    content
      .match(new RegExp(linkRegex, "g"))
      .map((m) => m.match(linkRegex)[1])
      .map(decodeURIComponent)
  )
);
console.log("filenames to upload with", extension, "\n", fileNames);
const uploads = fileNames
  .map((m) => ({
    name: m,
    Body: fs.readFileSync(path.join(__dirname, "..", "out", m)).toString(),
  }))
  .map(({ name, Body }) =>
    s3.upload({ 
      Bucket: "roamjs.com", 
      Body, 
      Key: name.slice(1), 
      ContentType: name.endsWith('.js')
        ? 'text/javascript' 
        : name.endsWith('.css') 
          ? "text/css" 
          : "text/plain" 
    }).promise()
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
])
  .then(() => {
    console.log("Successfully uploaded files");
    return cloudfront
      .createInvalidation({
        DistributionId,
        InvalidationBatch: {
          CallerReference: new Date().toJSON(),
          Paths: {
            Quantity: 1,
            Items: [`/extensions/${extension}`],
          },
        },
      })
      .promise();
  })
  .then((r) => waitForCloudfront({Id: r.Invalidation.Id, DistributionId}))
  .then(console.log);
