const withMdx = require("next-mdx-enhanced");
const withOptimizedImages = require("next-optimized-images"); // https://github.com/vercel/next.js/issues/18356
const withReactSvg = require("next-react-svg");
const path = require("path");
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
  withOptimizedImages(
    withReactSvg({
      include: path.resolve(__dirname, "components/svg"),
      pageExtensions: ["tsx", "mdx"],
      handleImages: ["jpeg", "png", "webp", "gif"],
      basePath: process.env.APP_BASE_PATH || "",
    })
  )
);
