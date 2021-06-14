import { CloudFrontRequestHandler } from "aws-lambda";

const movedUris = ["google-calendar"];

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  if (olduri.startsWith('/docs/extensions')) {
    const doc = /\/docs\/extensions\/([\w-]*)/.exec(olduri)?.[1];
    if (movedUris.includes(doc)) {
      const response = {
        status: "302",
        statusDescription: "Found",
        headers: {
          location: [
            {
              key: "Location",
              value: `https://roamjs.com/extensions/${doc}`,
            },
          ],
        },
      };
      return callback(null, response);
    }
  }
  return callback(null, request);
};
