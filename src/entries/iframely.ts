import { render } from "../components/IframelyEmbed";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import SelectPanel from "roamjs-components/components/ConfigPanels/SelectPanel";
import {
  SelectField,
  Field,
} from "roamjs-components/components/ConfigPanels/types";
import runExtension from "roamjs-components/util/runExtension";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";

const ID = "iframely";

runExtension(ID, () => {
  createConfigObserver({
    title: `roam/js/${ID}`,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              title: "view",
              Panel: SelectPanel,
              description:
                "Specifying how all iframely cards should render by default",
              options: {
                items: ["summary", "card", "iframe", "off"],
              },
            } as Field<SelectField>,
          ],
        },
      ],
    },
  });
  createButtonObserver({
    shortcut: ID,
    attribute: ID,
    render,
  });
});
