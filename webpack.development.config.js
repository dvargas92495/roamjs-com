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
    entry: {
      ...commonConfig.entry,
      "webpack-dev-server/client?http://localhost:8080/":
        "webpack-dev-server/client?http://localhost:8080/",
    },
    mode: "development",
    performance: {
      hints: "error",
      maxEntrypointSize: 13946000,
      maxAssetSize: 13946000,
    },
    devServer: {
      contentBase: "./build",
    },
  };
};
