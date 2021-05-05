import { render, VersionSwitcherProps } from "../components/VersionSwitcher";
import { runExtension } from "../entry-helpers";

runExtension("versioning", () => {
  window.roamjs.extension.versioning = {
    switch: (args: VersionSwitcherProps) => {
      render(args);
    },
  };
});
