/// <reference types="next" />
/// <reference types="next/types/global" />

// https://github.com/jescalan/babel-plugin-import-glob-array/issues/7
interface FrontMatter {
  __resourcePath: string;
  description: string;
}

declare module "*.mdx" {
  const MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
  export const frontMatter: FrontMatter[];
}
