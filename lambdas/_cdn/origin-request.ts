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

// In the future, move this to the roamjs static site generator
const REDIRECTS: Record<string, string> = {
  "/multiplayer/main.js": "/samepage/main.js",
  // "/roam42/main.js": "/roam42/main.js",
};

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  if (movedUris.includes(olduri)) {
    request.uri = olduri.replace(/\.js$/, "/main.js");
  } else if (olduri.endsWith("/") && olduri.length > 1) {
    request.uri = olduri.replace(/\/$/, "");
  } else if (REDIRECTS[olduri]) {
    request.uri = REDIRECTS[olduri];
  } else {
    return callback(null, request);
  }
  console.log("Mapped", olduri, "to", request.uri);
  return callback(null, request);
};
