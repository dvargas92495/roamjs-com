import { CloudFrontRequestHandler } from "aws-lambda";

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  if (/^\/docs(\/extensions)?/.test(olduri)) {
    const newUri = olduri.replace(/^\/docs(\/extensions)?/, "/extensions");
    const response = {
      status: "301",
      statusDescription: "Moved Permanently",
      headers: {
        location: [
          {
            key: "Location",
            value: `https://roamjs.com/${newUri}`,
          },
        ],
      },
    };
    return callback(null, response);
  }
  return callback(null, request);
};
