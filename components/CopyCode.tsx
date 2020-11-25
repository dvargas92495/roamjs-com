import { CheckboxForm } from "@dvargas92495/ui";
import { useCallback, useState } from "react";
import { useUser } from "react-manage-users";
import { frontMatter as frontMatters } from "../pages/docs/extensions/*.mdx";
import { pathToId } from "./ExtensionLayout";
import { useCopyCode } from "./hooks";
import axios from "axios";
import { API_URL } from "./constants";

const scriptIds = frontMatters
  .filter((f) => !f.development)
  .map((f) => pathToId(f.__resourcePath)) as string[];

const CopyCode = () => {
  const user = useUser();
  const [saved, setSaved] = useState(false);
  const onCopySave = useCopyCode(setSaved);
  const onRoamInstall = useCallback(
    (scriptNames: string[]) =>
      axios
        .put(`${API_URL}/install`, {
          graphName: "roam-js-extensions",
          scriptIds: scriptNames.map((f) => f.replace(/ /g, "-").toLowerCase()),
        })
        .then(() => setSaved(true))
        .catch(console.error),
    [setSaved]
  );
  return (
    <CheckboxForm
      items={scriptIds.map((s) => s.replace(/-/g, " ").toUpperCase())}
      onSave={!!user ? onRoamInstall : onCopySave}
      buttonText={
        !!user ? (saved ? "Installed!" : "Install") : saved ? "Copied!" : "Copy"
      }
    />
  );
};

export default CopyCode;
