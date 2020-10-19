import { createObserver, getRefTitlesByBlockUid, getUids } from "../entry-helpers";
import Color from 'color';

createObserver((ms) => {
  const record = ms.find(
    (m) =>
      !!Array.from(m.addedNodes).find(
        (d) =>
          d.nodeName === "DIV" &&
          Array.from((d as HTMLDivElement).classList).indexOf("roam-block") > -1
      )
  );
  if (record) {
    const block = record.addedNodes[0] as HTMLDivElement;
    const { blockUid } = getUids(block);
    const refs = getRefTitlesByBlockUid(blockUid);
    refs.forEach(r => {
        try{
            const c = Color(`#${r}`);
            console.log("Successfully parsed color!", c);
        } catch(e) {
            if (!e.message || !e.message.startsWith("Unable to parse color from string")) {
                throw e;
            }
        }
    })
  }
});
