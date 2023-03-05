/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next-react-svg" />

declare module "*.mdx" {
  const MDXComponent: React.FunctionComponent;
  export default MDXComponent;
  export const frontMatter: FrontMatter[];
}
