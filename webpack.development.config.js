const common = require("./webpack.config");

module.exports = (env) => {
  const commonConfig = common(env);
  commonConfig.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
  });
  return {
    ...commonConfig,
    mode: "development",
    performance: {
      hints: "error",
      maxEntrypointSize: 13946000,
      maxAssetSize: 13946000,
    },
  };
};
