import { createButtonObserver, getTextByBlockUid, getUidsFromButton } from "roam-client";
import { runExtension } from "../entry-helpers";

const ID = "iframely";

runExtension(ID, () => {
  createButtonObserver({
      shortcut: 'iframely',
      attribute: 'iframely',
      render: (b) => {
          const { blockUid } = getUidsFromButton(b);
          const text = getTextByBlockUid(blockUid);
          const url = /{{(\[\[)?iframely(\]\])?:(.*?)}}/.exec(text)?.[1];
          console.log(url);
      }
  })
});
