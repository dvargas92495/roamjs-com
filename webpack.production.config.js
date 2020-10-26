const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 2000000,
      maxAssetSize: 2000000,
    },
};
