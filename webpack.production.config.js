const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 500000,
      maxAssetSize: 500000,
    },
};
