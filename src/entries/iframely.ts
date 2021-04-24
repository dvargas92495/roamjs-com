import { createButtonObserver } from "roam-client";
import { runExtension } from "../entry-helpers";
import { render } from "../components/IframelyEmbed";
import { createConfigObserver } from "roamjs-components";

const ID = "iframely";

runExtension(ID, () => {
  createConfigObserver(
    {
      title: `roam/js/${ID}`,
      config: {
        tabs: [
          {id: 'home', fields: [{
            title: 'view',
            type: 'select',
            description: 'Specifying how all iframely cards should render by default',
            options: {
              items: [
                'summary',
                'card',
                'iframe',
                'off'
              ]
            }
          }]}
        ]
      }
    }
  );
  createButtonObserver({
    shortcut: ID,
    attribute: ID,
    render,
  });
});
