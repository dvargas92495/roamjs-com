const common = require("./webpack.config");
const webpack = require("webpack");

module.exports = (env) => {
  const commonConfig = common(env);
  commonConfig.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
  });
  const entry = Object.fromEntries(
    Object.entries(commonConfig.entry).map(([k, v]) => [
      k,
      //  [
      //   "webpack-dev-server/client?http://127.0.0.1:8080/",
      // "webpack/hot/only-dev-server",
      v,
      //],
    ])
  );
  return {
    ...commonConfig,
    entry,
    mode: "development",
    output: {
      ...commonConfig.output,
      publicPath: 'http://localhost:8080/',
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
      publicPath: 'http://localhost:8080/',
      headers: {
        'Access-Control-Allow-Origin': 'https://roamresearch.com',
      },
    },
    plugins: [
      ...commonConfig.plugins,
      new webpack.HotModuleReplacementPlugin(),
    ],
  };
};
