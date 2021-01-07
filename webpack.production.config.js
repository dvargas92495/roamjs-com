const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 2412296,
      maxAssetSize: 2412296,
    },
});
