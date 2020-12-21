const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'production',
    performance: {
      hints: "error",
      maxEntrypointSize: 2055209,
      maxAssetSize: 2055209,
    },
});
