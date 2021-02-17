const fs = require("fs");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

const buildEntry = (dir) => {
  const extensions = fs.readdirSync(`./src/${dir}/`);
  const entry = Object.fromEntries(
    extensions.map((e) => [e.substring(0, e.length - 3), `./src/${dir}/${e}`])
  );
  return entry;
};

module.exports = (env) => ({
  target: "node",
  entry: buildEntry(env.dir || "api"),
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "production",
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "out"),
    filename: "[name].js",
    strictModuleExceptionHandling: true,
  },
  externals: ["aws-sdk"],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                noEmit: false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: ".env.local",
      systemvars: true,
    }),
    ...(env && env.analyze
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
          }),
        ]
      : [])
  ],
});
