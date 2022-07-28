import { CloudFrontResponseHandler } from "aws-lambda";

export const handler: CloudFrontResponseHandler = (event, _, callback) => {
  const { request, response } = event.Records[0].cf;
  if (/\.js$/.test(request.uri)) {
    response.headers["Cache-Control"] = [{ value: "no-store" }];
  }
  return callback(null, response);
};
