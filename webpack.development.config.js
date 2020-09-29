const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 3000000,
      maxAssetSize: 3000000,
    },
};
