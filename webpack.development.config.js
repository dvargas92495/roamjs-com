const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 6000000,
      maxAssetSize: 6000000,
    },
});
