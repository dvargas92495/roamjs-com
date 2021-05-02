const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 4146296,
      maxAssetSize: 4146296,
    },
});
