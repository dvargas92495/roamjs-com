const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 3146296,
      maxAssetSize: 3146296,
    },
});
