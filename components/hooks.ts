import { useCallback, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";

const copyCode = (items: string[]) => (e) => {
  const scripts = items
    .map((f) => `installScript("${f.replace(/ /g, "-").toLowerCase()}");`)
    .join("\n");
  const codeContent = `\`\`\`javascript
var installScript = name => {
  var existing = document.getElementById(name);
  if (existing) {
    return;
  }  
  var extension = document.createElement("script");      
  extension.type = "text/javascript";
  extension.src = \`https://roamjs.com/$\{name}.js\`;
  extension.async = true;
  extension.id = name;
  document.getElementsByTagName("head")[0].appendChild(extension);
};
${scripts}
    \`\`\``;
  e.clipboardData.setData(
    "text/plain",
    `{{[[roam/js]]}}
    ${codeContent.replace(/"/g, "\u0022")}
  `
  );
  e.clipboardData.setData(
    "roam/data",
    `["^ ","~:type","~:copy","~:copied-data",[["^ ","~:block/string","{{[[roam/js]]}}","~:block/children",[["^ ","~:block/string","~${codeContent
      .replace(/\n/g, "\\n")
      .replace(
        /"/g,
        '\\"'
      )}","~:block/open",true,"~:block/order",0]],"~:block/open",true]]]`
  );
  e.preventDefault();
};

export const useCopyCode = (
  setCopied: (flag: boolean) => void
): ((items: string[]) => void) =>
  useCallback(
    (items: string[]) => {
      document.addEventListener("copy", copyCode(items));
      document.execCommand("copy");
      document.removeEventListener("copy", copyCode(items));
      setCopied(true);
    },
    [setCopied]
  );

export const useIsMobile = (): boolean => {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile);
  }, [setMobile]);

  return mobile;
};
