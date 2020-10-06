const common = require("./webpack.config");

module.exports = {
    ...common,
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 400000,
      maxAssetSize: 400000,
    },
};
