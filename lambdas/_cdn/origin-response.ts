import { CloudFrontResponseHandler } from "aws-lambda";

export const handler: CloudFrontResponseHandler = (event, _, callback) => {
  const { request, response } = event.Records[0].cf;
  if (/\.js$/.test(request.uri)) {
    response.headers["Cache-Control"] = [{ value: "no-store" }];
  } else {
    response.headers["Cache-Control"] = [{ value: "no-cache" }];
  }
  if (/\/download\/extension\.js$/i.test(request.uri)) {
    response.headers["Content-Disposition"] = [
      { value: `attachment; filename="extension.js"` },
    ];
  }
  return callback(null, response);
};
