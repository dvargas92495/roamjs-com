const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 4000000,
      maxAssetSize: 4000000,
    },
};
