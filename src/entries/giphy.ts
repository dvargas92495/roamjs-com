import { runExtension } from "../entry-helpers";
import { render } from '../components/GiphyPopover';

runExtension("giphy", () => {
  render();
});
