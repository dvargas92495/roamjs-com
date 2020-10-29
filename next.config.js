const withMdx = require("next-mdx-enhanced");
const rehypePrism = require("@mapbox/rehype-prism");
const remarkAutoLinkHeadings = require('remark-autolink-headings');
const remarkSlug = require('remark-slug');
const remarkCodeTitles = require('remark-code-titles');

module.exports = withMdx({
  layoutPath: "components",
  remarkPlugins: [
    remarkAutoLinkHeadings,
    remarkSlug,
    remarkCodeTitles,
  ],
  rehypePlugins: [rehypePrism],
})({
  pageExtensions: ["tsx", "mdx"],
  basePath: process.env.APP_BASE_PATH || "",
});
