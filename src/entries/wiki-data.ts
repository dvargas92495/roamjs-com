import { renderWikiData } from "../components/WikiData";
import { createButtonObserver } from "../entry-helpers";

createButtonObserver({
  shortcut: "wiki",
  attribute: "wiki-data",
  render: (b: HTMLButtonElement) => renderWikiData(b.parentElement),
});
