const common = require("./webpack.config");
const webpack = require("webpack");

module.exports = (env, a, b, c) => {
  console.log(env, a, b, c);
  const commonConfig = common(env);
  commonConfig.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
  });
  const typescriptRule = commonConfig.module.rules.find((r) =>
    r.test.test(".ts")
  );
  typescriptRule.use.unshift({ loader: "react-hot-loader/webpack" });
  return {
    ...commonConfig,
    mode: "development",
    output: {
      ...commonConfig.output,
      publicPath: "http://localhost:8080/",
    },
    performance: {
      hints: "error",
      maxEntrypointSize: 13946000,
      maxAssetSize: 13946000,
    },
    devServer: {
      contentBase: "./build",
      host: "127.0.0.1",
      disableHostCheck: true,
      hot: true,
      publicPath: "http://localhost:8080/",
      headers: {
        "Access-Control-Allow-Origin": "https://roamresearch.com",
      },
    },
    plugins: [
      ...commonConfig.plugins,
      new webpack.HotModuleReplacementPlugin(),
    ],
  };
};
