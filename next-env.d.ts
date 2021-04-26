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

declare module "react-charts" {
  type SeriesType = "line" | "bubble" | "area" | "bar";
  type AxisType = "ordinal" | "time" | "utc" | "linear" | "log";
  export const Chart: React.FunctionComponent<{
    data: { label: string; data: (number | string | Date)[][] }[];
    axes: { primary?: boolean; type: AxisType; position: string }[];
    series: {
      type: SeriesType;
    };
    defaultColors?: string[];
  }>;
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

declare module "*.ne" {
  import Nearley from "nearley";
  const Rules: Nearley.CompiledRules;
  export default Rules;
}

declare module "../pages/services/*" {
  const blob: {
    _importMeta: { absolutePath: string; importedPath: string }[];
  };
  export default blob;
}
