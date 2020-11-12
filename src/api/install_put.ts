import { APIGatewayProxyEvent } from "aws-lambda";
import { RestClient } from "roam-client";
import { headers } from "../lambda-helpers";

const codeContent = (scriptIds: string[]) =>
  `\`\`\`var installScript = name => {
  var existing = document.getElementById(name);
  if (existing) {
    return;
  }  
  var extension = document.createElement(\"script\");      
  extension.type = \"text/javascript\";
  extension.src = \`https://roamjs.com/\$\{name\}.js\`;
  extension.async = true;
  extension.id = name;
  document.getElementsByTagName(\"head\")[0].appendChild(extension);
};
  
${scriptIds
  .map((f) => `installScript(\"${f}\");`)
  .join("")}
\`\`\``;

export const handler = (event: APIGatewayProxyEvent) => {
  const { graphName, scriptIds = [] } = JSON.parse(event.body);
  const client = new RestClient({
    graphName,
  });
  return client
    .findOrCreatePage("roam/js")
    .then((parentUid) =>
      client.findOrCreateBlock({
        text: "{{[[roam/js]]}}",
        parentUid,
      })
    )
    .then((parentUid) =>
      client.upsertBlock({
        text: codeContent(scriptIds),
        uid: "roamjs-uid",
        parentUid,
      })
    )
    .then((success) => ({
      statusCode: 200,
      body: JSON.stringify({ success }),
      headers,
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
