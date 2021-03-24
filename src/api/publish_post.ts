import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import Busboy from "busboy";
import { bareSuccessResponse, s3, serverError } from "../lambda-helpers";

export const handler: APIGatewayProxyHandler = async (event) =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: event.headers["content-type"],
    });
    const result = {} as { [k: string]: unknown };

    busboy.on("file", (_, file, filename, __, mimetype) => {
      file.on("data", (data) => (result["file"] = data));
      file.on("end", () => {
        result["filename"] = filename;
        result["contentType"] = mimetype;
      });
    });

    busboy.on("field", (fieldname, value) => (result[fieldname] = value));

    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ ...event, body: result }));

    busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
    busboy.end();
  })
    .then(
      (
        event: Omit<APIGatewayProxyEvent, "body"> & {
          body: { filename: string; file: Buffer; contentType: string };
        }
      ) => {
        const { id } = event.queryStringParameters;
        const { file, filename, contentType } = event.body;
        if (file.length === 0) {
          throw new Error(
            `Failed to parse any file content for ${filename} of type ${contentType}`
          );
        }

        return s3
          .putObject({
            Bucket: "roam-js-extensions",
            Key: `${id}/${filename}`,
            Body: file,
            ContentType: contentType,
          })
          .promise()
          .then(() => bareSuccessResponse(event));
      }
    )
    .catch((e) => serverError(e.message, event));
