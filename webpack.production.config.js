const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 1000000,
      maxAssetSize: 1000000,
    },
};
