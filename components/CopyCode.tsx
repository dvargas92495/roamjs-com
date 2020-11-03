import { CheckboxForm } from "@dvargas92495/ui";
import { useState } from "react";
import { frontMatter as frontMatters } from "../pages/docs/extensions/*.mdx";
import { pathToId } from "./ExtensionLayout";
import { useCopyCode } from "./hooks";

const scriptIds = frontMatters
  .filter((f) => !f.development)
  .map((f) => pathToId(f.__resourcePath)) as string[];

const CopyCode = () => {
  const [copied, setCopied] = useState(false);
  const onSave = useCopyCode(setCopied);
  return (
    <CheckboxForm
      items={scriptIds.map((s) => s.replace(/-/g, " ").toUpperCase())}
      onSave={onSave}
      buttonText={copied ? "Copied!" : "Copy"}
    />
  );
};

export default CopyCode;
