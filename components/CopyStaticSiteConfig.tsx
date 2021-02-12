import { Button } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import { cleanCode } from "./hooks";

const copyBlocks = (e: ClipboardEvent) => {
  const template = `\`\`\`html
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>David Vargas | \${PAGE_NAME}</title>
</head>
<body>
<div id="content">
<h1>\${PAGE_NAME}</h1>  
\${PAGE_CONTENT}
</div>
<div id="references">
<ul>
\${REFERENCES}
</ul>
</div>
</body>
\`\`\``;
  const referenceTemplate = `\`\`\`html
 <li>
   <a href="\${LINK}">
     <b>
       \${REFERENCE}
     </b>
   </a>
 </li>
 \`\`\``;
  e.clipboardData.setData(
    "text/plain",
    `- Index
    - [[Podcast]]
- Filter
    - Tagged With
        - Podcast
- Template
    - ${template}
- Reference Template
    - ${referenceTemplate}
`
  );
  e.clipboardData.setData(
    "roam/data",
    `["^ ","~:type","~:copy","~:copied-data",[["^ ","~:block/string","Index","~:block/children",[["^ ","~:block/string","[[Podcast]]","~:block/open",true,"~:block/order",0]],"~:block/open",true], ["^ ","~:block/string","Filter","~:block/children",[["^ ","~:block/string","Tagged With","~:block/open",true,"~:block/order",0, "~:block/children",[["^ ","~:block/string","Podcast","~:block/open",true,"~:block/order",0]]]],"~:block/open",true],["^ ","~:block/string","Template","~:block/children",[["^ ","~:block/string","${cleanCode(
      template
    )}","~:block/open",true,"~:block/order",0]],"~:block/open",true],["^ ","~:block/string","Reference Template","~:block/children",[["^ ","~:block/string","${cleanCode(
      referenceTemplate
    )}","~:block/open",true,"~:block/order",0]],"~:block/open",true]]]`
  );
  e.preventDefault();
};

const CopyStaticSiteConfig: React.FunctionComponent = () => {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(() => {
    document.addEventListener("copy", copyBlocks);
    document.execCommand("copy");
    document.removeEventListener("copy", copyBlocks);
    setCopied(true);
  }, [setCopied]);
  return (
    <div style={{ marginBottom: 24 }}>
      <Button onClick={onClick} color="primary" variant="contained">
        COPY CONFIGURATION
      </Button>
      {copied && <span style={{ marginLeft: 24 }}>COPIED!</span>}
    </div>
  );
};

export default CopyStaticSiteConfig;
