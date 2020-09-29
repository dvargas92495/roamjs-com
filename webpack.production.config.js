const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 300000,
      maxAssetSize: 300000,
    },
};