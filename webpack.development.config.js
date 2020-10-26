const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 5000000,
      maxAssetSize: 5000000,
    },
};
