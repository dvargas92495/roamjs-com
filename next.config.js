const withMdx = require("next-mdx-enhanced");
const withOptimizedImages = require("next-optimized-images"); // https://github.com/vercel/next.js/issues/18356
const remarkAutoLinkHeadings = require("remark-autolink-headings");
const remarkSlug = require("remark-slug");
const remarkUnwrapImages = require("remark-unwrap-images");
const remarkCodeTitles = require("remark-code-titles");

module.exports = withMdx({
  layoutPath: "components",
  remarkPlugins: [
    remarkAutoLinkHeadings,
    remarkSlug,
    remarkUnwrapImages,
    remarkCodeTitles,
  ],
})(
  withOptimizedImages({
    pageExtensions: ["tsx", "mdx"],
    basePath: process.env.APP_BASE_PATH || "",
  })
);
