const withMdx = require("next-mdx-enhanced");
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
})({
  pageExtensions: ["tsx", "mdx"],
  basePath: process.env.APP_BASE_PATH || "",
});
