const common = require("./webpack.config");

module.exports = (env) => ({
  ...common(env),
  mode: "production",
  performance: {
    hints: "error",
    maxEntrypointSize: 5000000,
    maxAssetSize: 5000000,
  },
});
