const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'development',
    performance: {
      hints: "error",
      maxEntrypointSize: 5588910,
      maxAssetSize: 5588910,
    },
});
