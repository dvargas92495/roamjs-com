const fs = require("fs");

const [_, __, id, description] = process.argv;
const format = `---
layout: "ExtensionPageLayout"
description: "${description}"
development: true
---
`;

fs.writeFileSync(`pages/docs/extensions/${id}.mdx`, format);
fs.writeFileSync(
  `src/entries/${id}.ts`,
  `import { runExtension } from "../entry-helpers";

const ID = "${id}";

runExtension(ID, () => {

});
`
);
