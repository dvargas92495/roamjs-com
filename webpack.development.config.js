const common = require("./webpack.config");

module.exports = (env) => ({
    ...common(env),
    mode: 'development',
    performance: {
      hints: "error",    
      maxEntrypointSize: 13946000,
      maxAssetSize: 13946000,
    },
});
