import { useCallback } from "react";

const copyCode = (items: string[]) => (e) => {
  const scripts = items
    .map((f) => `addScript("${f.replace(/ /g, "-").toLowerCase()}");`)
    .join("");
  const codeContent = `\`\`\`const addScript = name => {
        var old = document.getElementById(name);
        if (old) {
          return;
        }  
        var s = document.createElement('script');      
        s.type = \"text/javascript\";
        s.src = \`https://roamjs.com/\$\{name\}.js\`;
        s.async = true;
        s.id = name;
        document.getElementsByTagName('head')[0].appendChild(s);
      }
      
      ${scripts}
      \`\`\``;
  e.clipboardData.setData(
    "text/plain",
    `- {{[[roam/js]]}}
    - ${codeContent
      .replace(/\n/g, "")
      .replace(/  /g, "")
      .replace(/\'/g, '\u0027')
      .replace(/\"/g, '\u0022')
    }
  `
  );
  e.preventDefault();
};

export const useCopyCode = (setCopied: (flag: boolean) => void) =>
  useCallback(
    (items) => {
      document.addEventListener("copy", copyCode(items));
      document.execCommand("copy");
      document.removeEventListener("copy", copyCode(items));
      setCopied(true);
    },
    [setCopied]
  );
