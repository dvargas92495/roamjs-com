const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 2359296,
      maxAssetSize: 2359296,
    },
});
