/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next-react-svg" />

declare module "*.mdx" {
  const MDXComponent: React.FunctionComponent;
  export default MDXComponent;
  export const frontMatter: FrontMatter[];
}

declare module "@mozilla/readability" {
  export { default as Readability } from "mozilla-readability";
}

declare module "reveal.js" {
  type RevealOptions = {
    embedded?: boolean;
    slideNumber?: string;
    width?: number;
    height?: number;
    showNotes?: boolean;
    minScale?: number;
    maxScale?: number;
    backgroundTransition?: string;
  };
  declare class Reveal {
    constructor(options: RevealOptions);
    initialize: () => void;
    slide: (h: number) => void;
    on: (s: string, callback: () => void) => void;
  }
  export default Reveal;
}
