const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 6000000,
      maxAssetSize: 6000000,
    },
};
