const withMdx = require("next-mdx-enhanced");
const rehypePrism = require("@mapbox/rehype-prism");

module.exports = withMdx({
  layoutPath: "components",
  rehypePlugins: [rehypePrism],
})({
  pageExtensions: ["tsx", "mdx"],
  basePath: process.env.APP_BASE_PATH || "",
});
