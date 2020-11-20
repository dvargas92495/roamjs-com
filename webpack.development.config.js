const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 5211423,
      maxAssetSize: 5211423,
    },
});
