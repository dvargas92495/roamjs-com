import { CloudFrontRequestHandler } from "aws-lambda";

const movedUris = [
  "developer",
  "github",
  "google-calendar",
  "static-site",
  "query-builder",
  "todo-trigger",
  "twitter",
].map((e) => `/${e}.js`);

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  if (movedUris.includes(olduri)) {
    request.uri = olduri.replace(/\.js$/, "/main.js");
    console.log("Mapped", olduri, "to", request.uri);
  } else if (olduri.endsWith("/") && olduri.length > 1) {
    request.uri = olduri.replace(/\/$/, "");
    console.log("Mapped", olduri, "to", request.uri);
  }
  return callback(null, request);
};
