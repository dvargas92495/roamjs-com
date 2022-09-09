import runExtension from "roamjs-components/util/runExtension";
import { render, VersionSwitcherProps } from "../components/VersionSwitcher";

runExtension("versioning", () => {
  window.roamjs.extension.versioning = {
    switch: (args: VersionSwitcherProps) => {
      render(args);
    },
  };
});
